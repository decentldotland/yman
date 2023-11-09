export async function handle(state, action) {
  const input = action.input;

  if (input.function === "addToLobby") {
    const { user, admin_sig } = input;

    ContractAssert(!state.is_game_started, "ERROR_GAME_ALREADY_STARTED");

    await _moleculeSignatureVerification(state.admin, admin_sig, true);

    // validate user payment
    await _validatePlayerDeposit(user.payment_txid, user.near_id);

    state.players[user.evm_implicit_addr] = {
      near_id: user.near_id,
      balance: 1,
      kicked: false,
    };

    state.play_turns.push(user.evm_implicit_addr);

    return { state };
  }

  if (input.function === "startGame") {
    const { admin_sig } = input;

    await _moleculeSignatureVerification(state.admin, admin_sig, true);

    state.is_game_started = true;

    return { state };
  }

  if (input.function === "roll") {
    const { admin_sig, dice_result, player_addr, player_sig, pay_plot_rule } =
      input;

    ContractAssert(state.is_game_started, "ERROR_GAME_NOT_STARTED");
    await _moleculeSignatureVerification(player_addr, player_sig, false);
    await _moleculeSignatureVerification(state.admin, admin_sig, true);

    if (state.first_roll) {
      for (const addr in state.players) {
        state.plots["one"].players.push(addr);
      }

      state.first_roll = false;
    }

    ContractAssert(!state.players[player_addr].kicked, "ERROR_USER_LOST");

    let newPlot;

    const diceResult = _validateDiceResult(dice_result);
    const currentPlayerPlot = _getCurrentPlayerPosition(player_addr);

    if (diceResult + currentPlayerPlot > 20) {
      newPlot = diceResult + currentPlayerPlot - 20;
    } else if (currentPlayerPlot === 20) {
      newPlot = diceResult;
    } else {
      newPlot = currentPlayerPlot + diceResult;
    }

    // remove the player from his current plot
    const currentPlayerIndex = state.plots[
      numericToWord(currentPlayerPlot)
    ].players.findIndex((user) => user === player_addr);

    state.plots[numericToWord(currentPlayerPlot)].players.splice(
      currentPlayerIndex,
      1,
    );
    //move him to his new plot
    state.plots[numericToWord(newPlot)].players.push(player_addr);

    // now check if the plot have is a 21 with a rule,
    // if so, validate the rule

    if ([6, 11, 16].includes(newPlot)) {
      const plot21 = state.plots[numericToWord(newPlot)];

      if (!plot21.rules.owner) {
        // if the 21 plot is not assigned, gave it to the first lander
        state.plots[numericToWord(newPlot)].rules.owner = player_addr;
      }

      if (
        plot21.rules.owner !== player_addr &&
        typeof plot21.rules.owner === "string"
      ) {
        // if the plot21 is claimed by an address different than the current lander, then
        // he has to do the rule
        const taskResult = await _validateRuleOfPlot(
          newPlot,
          pay_plot_rule,
          player_addr,
        );

        if (!taskResult && state.players[player_addr].balance <= 0.1) {
          state.players[player_addr].balance -= 0.1;
          state.players[player_addr].kicked = true;
          const indexInTurns = state.play_turns.findIndex((player) => player === player_addr);
          ContractAssert(indexInTurns >= 0, "ERROR_INVALID_PLAYER");
          state.play_turns.splice(indexInTurns, 1);
        } else if (!taskResult) {
          state.players[player_addr].balance -= 0.1;
        }
      }

      // if the current lander is plot21 owner, then do nothing
    }

    // update the turns
    const userPlayed = state.play_turns.shift();
    state.play_turns.push(userPlayed);

    return { state };
  }

  async function _validateRuleOfPlot(plot, txid, sender) {
    switch (plot) {
      case plot === 6:
        return await _validateNearTransfer(txid, sender);

      case plot === 11:
        return await _validateRefFinanceSwap(txid, sender);

      case plot === 16:
        return await _validateMintbaseAction(txid, sender);

      default:
        return false;
    }
  }

  function _validateDiceResult(roll) {
    ContractAssert(roll.length === 2, "ERROR_INVALID_DICE_RESULT");

    for (const res of roll) {
      ContractAssert(Number.isInteger(res), "ERROR_INVALID_DICE_RESULT");
      ContractAssert(res >= 0 && res <= 6, "ERROR_INVALID_DICE_RESULT");
    }

    return roll.reduce((a, b) => a + b, 0);
  }

  function _getCurrentPlayerPosition(address) {
    for (const position in state.plots) {
      if (state.plots[position].players.includes(address)) {
        return wordToNumeric(position);
      }
    }

    throw new ContractError("ERROR_INVALID_ADDRESS_OR_USER_POSITION");
  }

  async function _validateNearTransfer(txid, sender) {
    try {
      ContractAssert(!state.proofs.includes(txid), "ERROR_TRANSFER_USED");
      const txsRes = await EXM.deterministicFetch(
        "https://rpc.mainnet.near.org",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "dontcare",
            method: "tx",
            params: [txid, sender],
          }),
        },
      );

      const receiver = state.plots["six"]?.rules?.receiver_id;
      const tx = txsRes.asJSON().result.transaction;
      const cond1 = tx.signer_id === sender && tx.receiver_id === receiver;
      const cond2 =
        Number(tx.actions[0]?.["Transfer"]?.deposit) ===
        "500000000000000000000000"; // 0.5 NEAR
      state.proofs.push(txid);
      return cond1 && cond2;
    } catch (error) {
      return false;
    }
  }

  async function _validatePlayerDeposit(txid, sender) {
    ContractAssert(!state.proofs.includes(txid), "ERROR_TRANSFER_USED");

    const txsRes = await EXM.deterministicFetch(
      "https://rpc.mainnet.near.org",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "tx",
          params: [txid, sender],
        }),
      },
    );

    const tx = txsRes.asJSON().result.transaction;

    const cond1 =
      tx.signer_id === sender && tx.receiver_id === state.treasury_address; // 0.2 NEAR 200000000000000000000000
    const cond2 =
      tx.actions[0]["Transfer"].deposit === "1000000000000000000000000"; // 1 NEAR 1000000000000000000000000
    state.proofs.push(txid);
    ContractAssert(cond1 && cond2, "ERROR_INVALID_DEPOSIT");
  }

  async function _validateRefFinanceSwap(txid, sender) {
    ContractAssert(!state.proofs.includes(txid), "ERROR_TRANSFER_USED");
    const txsRes = await EXM.deterministicFetch(
      "https://rpc.mainnet.near.org",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "tx",
          params: [txid, sender],
        }),
      },
    );

    const tx = txsRes.asJSON().result.transaction;
    const cond1 = tx.signer_id === sender;
    const cond2 = JSON.parse(
      atob(tx.actions[0]?.["FunctionCall"]?.args),
    )?.endsWith(".ref-finance.near");
    state.proofs.push(txid);
    return cond1 && cond2;
  }

  async function _validateMintbaseAction(txid, sender) {
    ContractAssert(!state.proofs.includes(txid), "ERROR_TRANSFER_USED");
    const txsRes = await EXM.deterministicFetch(
      "https://rpc.mainnet.near.org",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "tx",
          params: [txid, sender],
        }),
      },
    );

    const tx = txsRes.asJSON().result.transaction;
    const cond1 = tx.signer_id === sender;
    const cond2 = tx.receiver_id.endsWith("mintbase1.near");

    state.proofs.push(txid);
    return cond1 && cond2;
  }

  async function _moleculeSignatureVerification(caller, signature, isAdmin) {
    try {
      let counter = state.users_counter;

      if (isAdmin) {
        ContractAssert(caller === state.admin, "ERROR_INVALID_CALLER");
        counter = state.admin_counter;
        state.admin_counter += 1;
      } else {
        state.users_counter += 1;
      }
      const encodedMessage = btoa(`${state.sig_message}${counter}`);
      ContractAssert(
        !state.signatures.includes(signature),
        "ERROR_SIGNATURE_ALREADY_USED",
      );

      const isValid = await EXM.deterministicFetch(
        `${state.evm_molecule_endpoint}/signer/${caller}/${encodedMessage}/${signature}`,
      );
      ContractAssert(isValid.asJSON()?.result, "ERROR_UNAUTHORIZED_CALLER");
      state.signatures.push(signature);
    } catch (error) {
      throw new ContractError("ERROR_MOLECULE.SH_CONNECTION");
    }
  }

  function wordToNumeric(word) {
    const dic = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
    };

    return dic[word];
  }

  function numericToWord(word) {
    const dic = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
    };

    // Reverse the keys and values in the dictionary
    const reversedDic = {};
    for (const key in dic) {
      reversedDic[dic[key]] = key;
    }

    return reversedDic[word];
  }
}
