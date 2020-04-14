var obdApi = new ObdApi();
var enumMsgType = new MessageType();

// Save connection status.
var isConnectToOBD = false;

// Save login status.
var isLogined = false;

// Save userID of a user already logined.
var userID;

// cssStyle
var cssStyle = 'color:gray';

// save OBD messages
var obdMessages = '';

// mnemonic using for login
var mnemonicWithLogined = '';

//
var inNewHtml = 'in_new_html';

//
var saveTempCI = 'channel_reation';

//
var saveAddr = 'addr';

//
var saveFriends = 'friends';

//
var saveMnemonic = 'mnemonic';

//
var saveGoWhere = 'go_where';

// the info save to local storage [ChannelCreation].
var channelInfo;

// word wrap code.
// result.setAttribute('style', 'word-break: break-all;white-space: normal;');

/**
 * Save fundingBTC parameters value.
 */
var btcFromAddr, btcFromAddrPrivKey, btcToAddr, btcAmount, btcMinerFee;

/**
 * Save temporary_channel_id parameters value.
 */
var strTempChID;


// Get name of saveGoWhere variable.
function getSaveName() {
    return saveGoWhere;
}

// getNewAddressWithMnemonic by local js library
function getNewAddressWithMnemonic() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    var newIndex = getNewAddrIndex();
    // console.info('mnemonicWithLogined = ' + mnemonicWithLogined);
    // console.info('addr index = ' + newIndex);

    // True: testnet  False: mainnet
    var result = btctool.generateWalletInfo(mnemonicWithLogined, newIndex, true);
    console.info('local addr data = ' + JSON.stringify(result));

    return result;
}

// get Address Info by local js library
function getAddressInfo() {
    if (!isLogined) { // Not logined
        alert('Please login first.');
        return '';
    }

    var index = $("#index").val();
    console.info('index = ' + index);

    try {
        // True: testnet  False: mainnet
        var result = btctool.generateWalletInfo(mnemonicWithLogined, index, true);
        console.info('local addr data = ' + JSON.stringify(result));
    } catch (error) {
        alert('Please input a valid index of address.');
        return '';
    }

    if (!result.status) { // status = false
        alert('Please input a valid index of address.');
        return '';
    }

    return result;
}

// 
function listeningN351(e, msgType) {
    console.info('listeningN351 = ' + JSON.stringify(e));

    saveChannelCreation(e, e.channelId, msgType);
    // createOBDResponseDiv(e, msgType);
}

// logIn API at local.
function logIn(msgType) {

    var mnemonic = $("#mnemonic").val();
    // console.info('mnemonic = ' + mnemonic);

    if (mnemonic === '') {
        alert('Please input a valid mnemonic.');
        return;
    }

    obdApi.logIn(mnemonic, function(e) {

        // Register event needed for listening.
        var msg_type = enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351;
        obdApi.registerEvent(msg_type, function(e) {
            listeningN351(e, msg_type);
        });

        console.info('logIn - OBD Response = ' + JSON.stringify(e));
        // If already logined, then stop listening to OBD Response,
        // DO NOT update the userID.
        if (isLogined) {
            createOBDResponseDiv(e, msgType);
            return;
        }

        // Otherwise, a new loginning, update the userID.
        mnemonicWithLogined = mnemonic;
        userID = e.userPeerId;
        $("#logined").text(userID);
        // $("#logined").text(userID.substring(0, 10) + '...');
        createOBDResponseDiv(e, msgType);
        isLogined = true;

        // save friends list
        saveFriendsList(userID, e.p2pNodePeerId);

    });
}

// 3 connectP2PNode API at local.
function connectP2PNode(msgType) {

    var node_url  = $("#node_url").val();

    // OBD API
    obdApi.connectP2PNode(node_url, function(e) {
        console.info('connectP2PNode - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

// -32 openChannel API at local.
function openChannel(msgType) {

    var p2pID  = $("#recipient_p2p_peer_id").val();
    var name   = $("#recipient_peer_id").val();
    var pubkey = $("#funding_pubkey").val();

    // if (name.trim() === '' || pubkey.trim() === '') {
    //     alert('Please input complete data.');
    //     return;
    // }

    // OBD API
    obdApi.openChannel(pubkey, name, p2pID, function(e) {
        console.info('openChannel - OBD Response = ' + JSON.stringify(e));

        // Save List of friends who have interacted.
        // saveFriendsList(name, p2pID);
        // Save Non-finalized channel information.
        saveChannelCreation(e);
        createOBDResponseDiv(e, msgType);
    });
}

// -33 accept Channel API at local.
function acceptChannel(msgType) {

    var p2pID    = $("#recipient_p2p_peer_id").val();
    var name     = $("#recipient_peer_id").val();
    var temp_cid = $("#temporary_channel_id").val();
    var pubkey   = $("#funding_pubkey").val();
    var approval = $("#checkbox_n33").prop("checked");

    let info = new AcceptChannelInfo();
    info.temporary_channel_id = temp_cid;
    info.funding_pubkey = pubkey;
    info.approval = approval;

    // Save value to variable
    strTempChID = temp_cid;

    // OBD API
    obdApi.acceptChannel(p2pID, name, info, function(e) {
        console.info('-33 acceptChannel - OBD Response = ' + JSON.stringify(e));
        // Save Non-finalized channel information.
        saveChannelCreation(e);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -44 htlc Sign GetH API at local.
 * @param msgType
 */
function htlcSignGetH(msgType) {

    var request_hash = $("#request_hash").val();
    var channel_address_private_key = $("#channel_address_private_key").val();
    var last_temp_address_private_key = $("#last_temp_address_private_key").val();
    var curr_rsmc_temp_address_pub_key = $("#curr_rsmc_temp_address_pub_key").val();
    var curr_rsmc_temp_address_private_key = $("#curr_rsmc_temp_address_private_key").val();
    var curr_htlc_temp_address_pub_key = $("#curr_htlc_temp_address_pub_key").val();
    var curr_htlc_temp_address_private_key = $("#curr_htlc_temp_address_private_key").val();
    var approval = $("#checkbox_n44").prop("checked");

    let info = new SignGetHInfo();
    info.request_hash = request_hash;
    info.channel_address_private_key = channel_address_private_key;
    info.last_temp_address_private_key = last_temp_address_private_key;
    info.curr_rsmc_temp_address_pub_key = curr_rsmc_temp_address_pub_key;
    info.curr_rsmc_temp_address_private_key = curr_rsmc_temp_address_private_key;
    info.curr_htlc_temp_address_pub_key = curr_htlc_temp_address_pub_key;
    info.curr_htlc_temp_address_private_key = curr_htlc_temp_address_private_key;
    info.approval = approval;

    // OBD API
    obdApi.htlcSignGetH(info, function(e) {
        console.info('-44 htlcSignGetH - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, e.channelId, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -45 CreateHtlcCTx API at local.
 * @param msgType
 */
function createHtlcCTx(msgType) {

    var request_hash = $("#request_hash").val();
    var channel_address_private_key = $("#channel_address_private_key").val();
    var last_temp_address_private_key = $("#last_temp_address_private_key").val();
    var curr_rsmc_temp_address_pub_key = $("#curr_rsmc_temp_address_pub_key").val();
    var curr_rsmc_temp_address_private_key = $("#curr_rsmc_temp_address_private_key").val();
    var curr_htlc_temp_address_pub_key = $("#curr_htlc_temp_address_pub_key").val();
    var curr_htlc_temp_address_private_key = $("#curr_htlc_temp_address_private_key").val();
    var curr_htlc_temp_address_for_ht1a_pub_key = $("#curr_htlc_temp_address_for_ht1a_pub_key").val();
    var curr_htlc_temp_address_for_ht1a_private_key = $("#curr_htlc_temp_address_for_ht1a_private_key").val();

    let info = new HtlcRequestOpen();
    info.request_hash = request_hash;
    info.channel_address_private_key = channel_address_private_key;
    info.last_temp_address_private_key = last_temp_address_private_key;
    info.curr_rsmc_temp_address_pub_key = curr_rsmc_temp_address_pub_key;
    info.curr_rsmc_temp_address_private_key = curr_rsmc_temp_address_private_key;
    info.curr_htlc_temp_address_pub_key = curr_htlc_temp_address_pub_key;
    info.curr_htlc_temp_address_private_key = curr_htlc_temp_address_private_key;
    info.curr_htlc_temp_address_for_ht1a_pub_key = curr_htlc_temp_address_for_ht1a_pub_key;
    info.curr_htlc_temp_address_for_ht1a_private_key = curr_htlc_temp_address_for_ht1a_private_key;

    // Get channel_id with request_hash.
    var tempChID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));
    for (let i = 0; i < list.result.length; i++) {
        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
            if (request_hash === list.result[i].htlc[i2].request_hash) {
                tempChID = list.result[i].htlc[i2].channelId;
            }
        }
    }

    // OBD API
    obdApi.htlcCreateCommitmentTx(info, function(e) {
        console.info('-45 htlcCreateCommitmentTx - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -46 htlcSendR API at local.
 * @param msgType
 */
function htlcSendR(msgType) {

    var r = $("#r").val();
    var request_hash = $("#request_hash").val();
    var channel_address_private_key = $("#channel_address_private_key").val();
    var curr_htlc_temp_address_for_he1b_pub_key = $("#curr_htlc_temp_address_for_he1b_pub_key").val();
    var curr_htlc_temp_address_for_he1b_private_key = $("#curr_htlc_temp_address_for_he1b_private_key").val();

    let info = new HtlcSendRInfo();
    info.r = r;
    info.request_hash = request_hash;
    info.channel_address_private_key = channel_address_private_key;
    info.curr_htlc_temp_address_for_he1b_pub_key = curr_htlc_temp_address_for_he1b_pub_key;
    info.curr_htlc_temp_address_for_he1b_private_key = curr_htlc_temp_address_for_he1b_private_key;

    // Get channel_id with request_hash.
    var tempChID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));
    for (let i = 0; i < list.result.length; i++) {
        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
            if (request_hash === list.result[i].htlc[i2].request_hash) {
                tempChID = list.result[i].htlc[i2].channelId;
            }
        }
    }

    // OBD API
    obdApi.htlcSendR(info, function(e) {
        console.info('-46 htlcSendR - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -47 htlcVerifyR API at local.
 * @param msgType
 */
function htlcVerifyR(msgType) {

    var r = $("#r").val();
    var request_hash = $("#request_hash").val();
    var channel_address_private_key = $("#channel_address_private_key").val();

    let info = new HtlcVerifyRInfo();
    info.r = r;
    info.request_hash = request_hash;
    info.channel_address_private_key = channel_address_private_key;

    // Get channel_id with request_hash.
    var tempChID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));
    for (let i = 0; i < list.result.length; i++) {
        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
            if (request_hash === list.result[i].htlc[i2].request_hash) {
                tempChID = list.result[i].htlc[i2].channelId;
            }
        }
    }

    // OBD API
    obdApi.htlcVerifyR(info, function(e) {
        console.info('-47 htlcVerifyR - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -48 closeHtlcTx API at local.
 * @param msgType
 */
function closeHtlcTx(msgType) {

    var channel_id = $("#channel_id").val();
    var channel_address_private_key = $("#channel_address_private_key").val();
    var last_rsmc_temp_address_private_key = $("#last_rsmc_temp_address_private_key").val();
    var last_htlc_temp_address_private_key = $("#last_htlc_temp_address_private_key").val();
    var last_htlc_temp_address_for_htnx_private_key = $("#last_htlc_temp_address_for_htnx_private_key").val();
    var curr_rsmc_temp_address_pub_key = $("#curr_rsmc_temp_address_pub_key").val();
    var curr_rsmc_temp_address_private_key = $("#curr_rsmc_temp_address_private_key").val();

    let info = new CloseHtlcTxInfo();
    info.channel_id = channel_id;
    info.channel_address_private_key = channel_address_private_key;
    info.last_rsmc_temp_address_private_key = last_rsmc_temp_address_private_key;
    info.last_htlc_temp_address_private_key = last_htlc_temp_address_private_key;
    info.last_htlc_temp_address_for_htnx_private_key = last_htlc_temp_address_for_htnx_private_key;
    info.curr_rsmc_temp_address_pub_key = curr_rsmc_temp_address_pub_key;
    info.curr_rsmc_temp_address_private_key = curr_rsmc_temp_address_private_key;

    // OBD API
    obdApi.closeHtlcTx(info, function(e) {
        console.info('-48 closeHtlcTx - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -49 closeHtlcTxSigned API at local.
 * @param msgType
 */
function closeHtlcTxSigned(msgType) {

    var request_close_htlc_hash = $("#request_close_htlc_hash").val();
    var channel_address_private_key = $("#channel_address_private_key").val();
    var last_rsmc_temp_address_private_key = $("#last_rsmc_temp_address_private_key").val();
    var last_htlc_temp_address_private_key = $("#last_htlc_temp_address_private_key").val();
    var last_htlc_temp_address_for_htnx_private_key = $("#last_htlc_temp_address_for_htnx_private_key").val();
    var curr_rsmc_temp_address_pub_key = $("#curr_rsmc_temp_address_pub_key").val();
    var curr_rsmc_temp_address_private_key = $("#curr_rsmc_temp_address_private_key").val();

    let info = new CloseHtlcTxInfoSigned();
    info.request_close_htlc_hash = request_close_htlc_hash;
    info.channel_address_private_key = channel_address_private_key;
    info.last_rsmc_temp_address_private_key = last_rsmc_temp_address_private_key;
    info.last_htlc_temp_address_private_key = last_htlc_temp_address_private_key;
    info.last_htlc_temp_address_for_htnx_private_key = last_htlc_temp_address_for_htnx_private_key;
    info.curr_rsmc_temp_address_pub_key = curr_rsmc_temp_address_pub_key;
    info.curr_rsmc_temp_address_private_key = curr_rsmc_temp_address_private_key;

    // Get channel_id with request_hash.
    var channel_id;
    var list = JSON.parse(localStorage.getItem(saveTempCI));
    for (let i = 0; i < list.result.length; i++) {
        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
            if (request_close_htlc_hash === list.result[i].htlc[i2].request_hash) {
                channel_id = list.result[i].htlc[i2].channel_id;
            }
        }
    }

    // OBD API
    obdApi.closeHtlcTxSigned(info, function(e) {
        console.info('-49 closeHtlcTxSigned - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -80 atomicSwap API at local.
 * @param msgType
 */
function atomicSwap(msgType) {

    var channel_id_from = $("#channel_id_from").val();
    var channel_id_to = $("#channel_id_to").val();
    var recipient_peer_id = $("#recipient_peer_id").val();
    var property_sent = $("#property_sent").val();
    var amount = $("#amount").val();
    var exchange_rate = $("#exchange_rate").val();
    var property_received = $("#property_received").val();
    var transaction_id = $("#transaction_id").val();
    var time_locker = $("#time_locker").val();


    let info = new AtomicSwapRequest();
    info.channel_id_from = channel_id_from;
    info.channel_id_to = channel_id_to;
    info.recipient_peer_id = recipient_peer_id;
    info.property_sent = Number(property_sent);
    info.amount = Number(amount);
    info.exchange_rate = Number(exchange_rate);
    info.property_received = Number(property_received);
    info.transaction_id = transaction_id;
    info.time_locker = Number(time_locker);

    // OBD API
    obdApi.atomicSwap(info, function(e) {
        console.info('-80 atomicSwap - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -81 atomicSwapAccepted API at local.
 * @param msgType
 */
function atomicSwapAccepted(msgType) {

    var channel_id_from = $("#channel_id_from").val();
    var channel_id_to = $("#channel_id_to").val();
    var recipient_peer_id = $("#recipient_peer_id").val();
    var property_sent = $("#property_sent").val();
    var amount = $("#amount").val();
    var exchange_rate = $("#exchange_rate").val();
    var property_received = $("#property_received").val();
    var transaction_id = $("#transaction_id").val();
    var target_transaction_id = $("#target_transaction_id").val();
    var time_locker = $("#time_locker").val();

    let info = new AtomicSwapAccepted();
    info.channel_id_from = channel_id_from;
    info.channel_id_to = channel_id_to;
    info.recipient_peer_id = recipient_peer_id;
    info.property_sent = Number(property_sent);
    info.amount = Number(amount);
    info.exchange_rate = Number(exchange_rate);
    info.property_received = Number(property_received);
    info.transaction_id = transaction_id;
    info.target_transaction_id = target_transaction_id;
    info.time_locker = Number(time_locker);

    // OBD API
    obdApi.atomicSwapAccepted(info, function(e) {
        console.info('-81 atomicSwapAccepted - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -38 closeChannel API at local.
 * @param msgType
 */
function closeChannel(msgType) {

    var channel_id = $("#channel_id").val();

    // OBD API
    obdApi.closeChannel(channel_id, function(e) {
        console.info('-38 closeChannel - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -39 closeChannelSigned API at local.
 * @param msgType
 */
function closeChannelSigned(msgType) {

    var channel_id = $("#channel_id").val();
    var request_close_channel_hash = $("#request_close_channel_hash").val();
    var approval = $("#checkbox_n39").prop("checked");

    let info = new CloseChannelSign();
    info.channel_id = channel_id;
    info.request_close_channel_hash = request_close_channel_hash;
    info.approval = approval;

    // OBD API
    obdApi.closeChannelSign(info, function(e) {
        console.info('-39 closeChannelSign - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * 1200 getBalanceForOmni API at local.
 * @param msgType
 */
function getBalanceForOmni(msgType) {

    var address = $("#address").val();

    // OBD API
    obdApi.omniGetAllBalancesForAddress(address, function(e) {
        console.info('1200 getBalanceForOmni - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -35109 getAllBRTx API at local.
 * @param msgType
 */
function getAllBRTx(msgType) {

    var channel_id = $("#channel_id").val();

    // OBD API
    obdApi.getAllBRTx(channel_id, function(e) {
        console.info('-35109 getAllBRTx - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -3207 GetChannelDetail API at local.
 * @param msgType
 */
function getChannelDetail(msgType) {

    var id = $("#id").val();

    // OBD API
    obdApi.getChannelById(Number(id), function(e) {
        console.info('-3207 GetChannelDetail - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -3202 getAllChannels API at local.
 * @param msgType
 */
function getAllChannels(msgType) {
    // OBD API
    obdApi.getAllChannels(function(e) {
        console.info('-3202 getAllChannels - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -35101 GetAllCommitmentTransactions API at local.
 * @param msgType
 */
function getAllCommitmentTransactions(msgType) {

    var channel_id = $("#channel_id").val();

    // OBD API
    obdApi.getItemsByChannelId(channel_id, function(e) {
        console.info('-35101 GetAllCommitmentTransactions - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

/** 
 * -35104 getLatestCommitmentTx API at local.
 * @param msgType
 */
function getLatestCommitmentTx(msgType) {

    var channel_id = $("#channel_id").val();

    // OBD API
    obdApi.getLatestCommitmentTxByChannelId(channel_id, function(e) {
        console.info('-35104 getLatestCommitmentTx - OBD Response = ' + JSON.stringify(e));
        createOBDResponseDiv(e, msgType);
    });
}

// BTC Funding Created -3400 API at local.
function btcFundingCreated(msgType) {

    var p2pID    = $("#recipient_p2p_peer_id").val();
    var name     = $("#recipient_peer_id").val();
    var temp_cid = $("#temporary_channel_id").val();
    var privkey  = $("#channel_address_private_key").val();
    var tx_hex   = $("#funding_tx_hex").val();

    let info = new FundingBtcCreated();
    info.temporary_channel_id = temp_cid;
    info.channel_address_private_key = privkey;
    info.funding_tx_hex = tx_hex;

    // Save value to variable
    strTempChID = temp_cid;

    // OBD API
    obdApi.btcFundingCreated(p2pID, name, info, function(e) {
        console.info('btcFundingCreated - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, temp_cid, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// BTC Funding Signed -3500 API at local.
function btcFundingSigned(msgType) {

    var p2pID    = $("#recipient_p2p_peer_id").val();
    var name     = $("#recipient_peer_id").val();
    var temp_cid = $("#temporary_channel_id").val();
    var privkey  = $("#channel_address_private_key").val();
    var tx_id    = $("#funding_txid").val();
    var approval = $("#checkbox_n3500").prop("checked");

    let info = new FundingBtcSigned();
    info.temporary_channel_id = temp_cid;
    info.channel_address_private_key = privkey;
    info.funding_txid = tx_id;
    info.approval = approval;

    // Save value to variable
    strTempChID = temp_cid;

    // OBD API
    obdApi.btcFundingSigned(p2pID, name, info, function(e) {
        console.info('btcFundingSigned - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, temp_cid, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Omni Asset Funding Created -34 API at local.
function assetFundingCreated(msgType) {

    var p2pID    = $("#recipient_p2p_peer_id").val();
    var name     = $("#recipient_peer_id").val();
    var temp_cid = $("#temporary_channel_id").val();
    var t_ad_pbk = $("#temp_address_pub_key").val();
    var t_ad_prk = $("#temp_address_private_key").val();
    var privkey  = $("#channel_address_private_key").val();
    var tx_hex   = $("#funding_tx_hex").val();

    let info = new ChannelFundingCreatedInfo();
    info.temporary_channel_id = temp_cid;
    info.temp_address_pub_key = t_ad_pbk;
    info.temp_address_private_key = t_ad_prk;
    info.channel_address_private_key = privkey;
    info.funding_tx_hex = tx_hex;

    // Save value to variable
    strTempChID = temp_cid;

    // OBD API
    obdApi.channelFundingCreated(p2pID, name, info, function(e) {
        console.info('N34 - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, temp_cid, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Omni Asset Funding Signed -35 API at local.
function assetFundingSigned(msgType) {

    var p2pID      = $("#recipient_p2p_peer_id").val();
    var name       = $("#recipient_peer_id").val();
    var channel_id = $("#channel_id").val();
    var privkey    = $("#fundee_channel_address_private_key").val();
    var approval   = $("#checkbox_n35").prop("checked");

    let info = new ChannelFundingSignedInfo();
    info.channel_id = channel_id;
    info.fundee_channel_address_private_key = privkey;
    info.approval = approval;

    // OBD API
    obdApi.channelFundingSigned(p2pID, name, info, function(e) {
        console.info('N35 - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// funding BTC API at local.
function fundingBTC(msgType) {

    var from_address = $("#from_address").val();
    var from_address_private_key = $("#from_address_private_key").val();
    var to_address = $("#to_address").val();
    var amount = $("#amount").val();
    var miner_fee = $("#miner_fee").val();

    let info = new BtcFundingInfo();
    info.from_address = from_address;
    info.from_address_private_key = from_address_private_key;
    info.to_address = to_address;
    info.amount = Number(amount);
    info.miner_fee = Number(miner_fee);

    //Save value to variable
    btcFromAddr = from_address;
    btcFromAddrPrivKey = from_address_private_key;
    btcToAddr = to_address;
    btcAmount = amount;
    btcMinerFee = miner_fee;

    // Get temporary_channel_id with channel_address.
    var tempChID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));
    for (let i = 0; i < list.result.length; i++) {
        for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
            if (to_address === list.result[i].data[i2].channel_address) {
                tempChID = list.result[i].data[i2].temporary_channel_id;
            }
        }
    }

    // OBD API
    obdApi.fundingBTC(info, function(e) {
        console.info('fundingBTC - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// funding Omni Asset API at local.
function fundingAsset(msgType) {

    var from_address = $("#from_address").val();
    var from_address_private_key = $("#from_address_private_key").val();
    var to_address = $("#to_address").val();
    var amount = $("#amount").val();
    var property_id = $("#property_id").val();

    let info = new OmniFundingAssetInfo();
    info.from_address = from_address;
    info.from_address_private_key = from_address_private_key;
    info.to_address = to_address;
    info.amount = Number(amount);
    info.property_id = Number(property_id);

    // Get temporary_channel_id with channel_address.
    var tempChID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));
    for (let i = 0; i < list.result.length; i++) {
        for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
            if (to_address === list.result[i].data[i2].channel_address) {
                tempChID = list.result[i].data[i2].temporary_channel_id;
            }
        }
    }

    // OBD API
    obdApi.fundingAssetOfOmni(info, function(e) {
        console.info('fundingAssetOfOmni - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// createInvoice API at local.
function createInvoice(msgType) {

    var property_id = $("#property_id").val();
    var amount = $("#amount").val();
    var recipient_peer_id = $("#recipient_peer_id").val();

    let info = new HtlcHInfo();
    info.property_id = Number(property_id);
    info.amount = Number(amount);
    info.recipient_peer_id = recipient_peer_id;

    // OBD API
    obdApi.htlcInvoice(info, function(e) {
        console.info('createInvoice - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// -42 htlcFindPathAndSendH API at local.
function htlcFindPathAndSendH(msgType) {

    var property_id = $("#property_id").val();
    var amount = $("#amount").val();
    var recipient_peer_id = $("#recipient_peer_id").val();
    var h = $("#h").val();
    var memo = $("#memo").val();

    let info = new HtlcRequestFindPathAndSendH();
    info.property_id = Number(property_id);
    info.amount = Number(amount);
    info.recipient_peer_id = recipient_peer_id;
    info.h = h;
    info.memo = memo;

    // OBD API
    obdApi.htlcFindPathAndSendH(info, function(e) {
        console.info('-42 htlcFindPathAndSendH - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, e.channelId, msgType, info);
        createOBDResponseDiv(e, msgType);
    });
}

// -43 htlcSendH API at local.
function htlcSendH(msgType) {

    var h = $("#h").val();
    var request_hash = $("#request_hash").val();

    // OBD API
    obdApi.htlcSendH(h, request_hash, function(e) {
        console.info('-43 htlcSendH - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e);
        createOBDResponseDiv(e, msgType);
    });
}

// add HTLC API at local.
function WillBeUpdatedHTLCFindPath(msgType) {

    var property_id = $("#property_id").val();
    var amount = $("#amount").val();
    var recipient_peer_id = $("#recipient_peer_id").val();

    let info = new HtlcHInfo();
    info.property_id = Number(property_id);
    info.amount = Number(amount);
    info.recipient_peer_id = recipient_peer_id;

    // OBD API
    obdApi.addHtlc(info, function(e) {
        console.info('addHTLC - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, tempChID, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Commitment Transaction Created -351 API at local.
function RSMCCTxCreated(msgType) {

    var p2pID    = $("#recipient_p2p_peer_id").val();
    var name     = $("#recipient_peer_id").val();
    var channel_id = $("#channel_id").val();
    var amount = $("#amount").val();
    var curr_temp_address_pub_key = $("#curr_temp_address_pub_key").val();
    var curr_temp_address_private_key = $("#curr_temp_address_private_key").val();
    var channel_address_private_key = $("#channel_address_private_key").val();
    var last_temp_address_private_key = $("#last_temp_address_private_key").val();

    let info = new CommitmentTx();
    info.channel_id = channel_id;
    info.amount = Number(amount);
    info.curr_temp_address_pub_key = curr_temp_address_pub_key;
    info.curr_temp_address_private_key = curr_temp_address_private_key;
    info.channel_address_private_key = channel_address_private_key;
    info.last_temp_address_private_key = last_temp_address_private_key;

    // OBD API
    obdApi.commitmentTransactionCreated(p2pID, name, info, function(e) {
        console.info('RSMCCTxCreated - OBD Response = ' + JSON.stringify(e));
        // saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Revoke and Acknowledge Commitment Transaction -352 API at local.
function RSMCCTxSigned(msgType) {

    var p2pID    = $("#recipient_p2p_peer_id").val();
    var name     = $("#recipient_peer_id").val();
    var channel_id = $("#channel_id").val();
    var curr_temp_address_pub_key = $("#curr_temp_address_pub_key").val();
    var curr_temp_address_private_key = $("#curr_temp_address_private_key").val();
    var channel_address_private_key = $("#channel_address_private_key").val();
    var last_temp_address_private_key = $("#last_temp_address_private_key").val();
    var request_commitment_hash = $("#request_commitment_hash").val();
    var approval = $("#checkbox_n352").prop("checked");

    let info = new CommitmentTxSigned();
    info.channel_id = channel_id;
    info.curr_temp_address_pub_key = curr_temp_address_pub_key;
    info.curr_temp_address_private_key = curr_temp_address_private_key;
    info.channel_address_private_key = channel_address_private_key;
    info.last_temp_address_private_key = last_temp_address_private_key;
    info.request_commitment_hash = request_commitment_hash;
    info.approval = approval;

    // OBD API
    obdApi.revokeAndAcknowledgeCommitmentTransaction(p2pID, name, info, function(e) {
        console.info('RSMCCTxSigned - OBD Response = ' + JSON.stringify(e));
        saveChannelCreation(e, channel_id, msgType);
        createOBDResponseDiv(e, msgType);
    });
}

// Invoke each APIs.
function invokeAPIs(objSelf) {

    var msgType = Number(objSelf.getAttribute('type_id'));
    console.info('type_id = ' + msgType);

    switch (msgType) {
        // Util APIs.
        case enumMsgType.MsgType_Core_Omni_Getbalance_1200:
            getBalanceForOmni(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_AllBRByChanId_N35109:
            getAllBRTx(msgType);
            break;
        case enumMsgType.MsgType_GetChannelInfoByChanId_N3207:
            getChannelDetail(msgType);
            break;
        case enumMsgType.MsgType_ChannelOpen_AllItem_N3202:
            getAllChannels(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_ItemsByChanId_N35101:
            getAllCommitmentTransactions(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104:
            getLatestCommitmentTx(msgType);
            break;
        case enumMsgType.MsgType_Core_GetNewAddress_1001:
            obdApi.getNewAddress(function(e) {
                console.info('OBD Response = ' + e);
                createOBDResponseDiv(e);
            });
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
            var result = getNewAddressWithMnemonic();
            if (result === '') return;
            saveAddrData(result);
            createOBDResponseDiv(result, msgType);
            break;
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
            var result = getAddressInfo();
            if (result === '') return;
            createOBDResponseDiv(result, msgType);
            break;

            // APIs for debugging.
        case enumMsgType.MsgType_UserLogin_1:
            logIn(msgType);
            break;
        case enumMsgType.MsgType_UserLogout_2:
            obdApi.logout();
            break;
        case enumMsgType.MsgType_GetMnemonic_101:
            // Generate mnemonic by local js library.
            // This is equal OBD api signUp.
            var mnemonic = btctool.generateMnemonic(128);
            saveMnemonicData(mnemonic);
            createOBDResponseDiv(mnemonic);
            break;
        case enumMsgType.MsgType_Core_FundingBTC_1009:
            fundingBTC(msgType);
            break;
        case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
            btcFundingCreated(msgType);
            break;
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            btcFundingSigned(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
            fundingAsset(msgType);
            break;
        case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
            assetFundingCreated(msgType);
            break;
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            assetFundingSigned(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
            RSMCCTxCreated(msgType);
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            RSMCCTxSigned(msgType);
            break;
        case enumMsgType.MsgType_Core_Omni_GetTransaction_1206:
            txid = "c76710920860456dff2433197db79dd030f9b527e83a2e253f5bc6ab7d197e73";
            obdApi.getOmniTxByTxid(txid);
            break;
            // Open Channel request.
        case enumMsgType.MsgType_ChannelOpen_N32:
            openChannel(msgType);
            break;
            // Accept Channel request.
        case enumMsgType.MsgType_ChannelAccept_N33:
            acceptChannel(msgType);
            break;
        case enumMsgType.MsgType_HTLC_Invoice_N4003:
            createInvoice(msgType);
            break;
        case enumMsgType.MsgType_HTLC_AddHTLC_N40:
            WillBeUpdatedHTLCFindPath(msgType);
            break;
        case enumMsgType.MsgType_HTLC_FindPathAndSendH_N42:
            htlcFindPathAndSendH(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendH_N43:
            htlcSendH(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SignGetH_N44:
            htlcSignGetH(msgType);
            break;
        case enumMsgType.MsgType_HTLC_CreateCommitmentTx_N45:
            createHtlcCTx(msgType);
            break;
        case enumMsgType.MsgType_HTLC_SendR_N46:
            htlcSendR(msgType);
            break;
        case enumMsgType.MsgType_HTLC_VerifyR_N47:
            htlcVerifyR(msgType);
            break;
        case enumMsgType.MsgType_HTLC_RequestCloseCurrTx_N48:
            closeHtlcTx(msgType);
            break;
        case enumMsgType.MsgType_HTLC_CloseSigned_N49:
            closeHtlcTxSigned(msgType);
            break;
        case enumMsgType.MsgType_CloseChannelRequest_N38:
            closeChannel(msgType);
            break;
        case enumMsgType.MsgType_CloseChannelSign_N39:
            closeChannelSigned(msgType);
            break;
        case enumMsgType.MsgType_Atomic_Swap_N80:
            atomicSwap(msgType);
            break;
        case enumMsgType.MsgType_Atomic_Swap_Accept_N81:
            atomicSwapAccepted(msgType);
            break;
        case enumMsgType.MsgType_p2p_ConnectServer_3:
            connectP2PNode(msgType);
            break;
        default:
            console.info(msgType + " do not exist");
            break;
    }
}

// 
function displayOBDMessages(content) {
    console.info("broadcast info:", JSON.stringify(content));

    switch (Number(content.type)) {
        case enumMsgType.MsgType_Error_0:
        case enumMsgType.MsgType_Core_GetNewAddress_1001:
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
        case enumMsgType.MsgType_GetMnemonic_101:
        case enumMsgType.MsgType_Core_BalanceByAddress_1008:
        case enumMsgType.MsgType_Core_FundingBTC_1009:
        case enumMsgType.MsgType_Core_Omni_Getbalance_1200:
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
        case enumMsgType.MsgType_HTLC_Invoice_N4003:
        case enumMsgType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104:
        case enumMsgType.MsgType_CommitmentTx_ItemsByChanId_N35101:
        case enumMsgType.MsgType_ChannelOpen_AllItem_N3202:
        case enumMsgType.MsgType_GetChannelInfoByChanId_N3207:
        case enumMsgType.MsgType_CommitmentTx_AllBRByChanId_N35109:
            return;
        case enumMsgType.MsgType_UserLogin_1:
            content.result = 'Logged In - ' + content.from;
            break;
        case enumMsgType.MsgType_p2p_ConnectServer_3:
            content.result = 'Connect to P2P Node success.';
            break;
        case enumMsgType.MsgType_ChannelOpen_N32:
            content.result = 'LAUNCH - ' + content.from +
                ' - launch an Open Channel request. ';
            // 'The [temporary_channel_id] is : ' + 
            // content.result.temporary_channel_id;
            break;
        case enumMsgType.MsgType_ChannelAccept_N33:
            if (content.result.curr_state === 11) { // Accept
                content.result = 'ACCEPT - ' + content.from +
                    ' - accept Open Channel request. ';
                // 'The [temporary_channel_id] is : ' + 
                // content.result.temporary_channel_id;
            } else if (content.result.curr_state === 30) { // Not Accept
                content.result = 'DECLINE - ' + content.from +
                    ' - decline Open Channel request. ';
                // 'The [temporary_channel_id] is : ' + 
                // content.result.temporary_channel_id;
            }
            break;
        case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
            content.result = 'Notification - ' + content.from +
                ' - depositing BTC in Channel.';
            break;
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            content.result = 'Reply - ' + content.from +
                ' - depositing BTC message.';
            break;
        case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
            content.result = 'Notification - ' + content.from +
                ' - depositing Omni Asset in Channel.';
            break;
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            content.result = 'Reply - ' + content.from +
                ' - depositing Omni Asset message.';
            break;
        case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
            content.result = 'RSMC transfer - ' + content.from +
                ' - launch a transfer.';
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            content.result = 'RSMC transfer - ' + content.from +
                ' - accept a transfer.';
            break;
        case enumMsgType.MsgType_HTLC_FindPathAndSendH_N42:
            content.result = 'HTLC - ' + content.from +
                ' - launch a HTLC transfer.';
            break;
        case enumMsgType.MsgType_HTLC_SendH_N43:
            content.result = 'HTLC - ' + content.from +
                ' - send H to next node.';
            break;
        case enumMsgType.MsgType_HTLC_SignGetH_N44:
            content.result = 'HTLC - ' + content.from +
                ' - accept a HTLC transfer.';
            break;
        case enumMsgType.MsgType_HTLC_CreateCommitmentTx_N45:
            content.result = 'HTLC - ' + content.from +
                ' - had create HTLC commitment transactions.';
            break;
        case enumMsgType.MsgType_HTLC_SendR_N46:
            content.result = 'HTLC - ' + content.from +
                ' - Sent R.';
            break;
        case enumMsgType.MsgType_HTLC_VerifyR_N47:
            content.result = 'HTLC - ' + content.from +
                ' - Verify R.';
            break;
        case enumMsgType.MsgType_HTLC_RequestCloseCurrTx_N48:
            content.result = 'HTLC - ' + content.from +
                ' - Request Close.';
            break;
        case enumMsgType.MsgType_HTLC_CloseSigned_N49:
            content.result = 'HTLC - ' + content.result.msg;
            break;
        case enumMsgType.MsgType_CloseChannelRequest_N38:
            content.result = 'N38 Request Close Channel from - ' + content.from;
            break;
        case enumMsgType.MsgType_CloseChannelSign_N39:
            content.result = 'N39 Response Close Channel from - ' + content.from;
            break;
        case enumMsgType.MsgType_Atomic_Swap_N80:
            content.result = 'N80 Request Atomic Swap from - ' + content.from;
            break;
        case enumMsgType.MsgType_Atomic_Swap_Accept_N81:
            content.result = 'N81 Response Atomic Swap from - ' + content.from;
            break;
    }

    content = JSON.stringify(content.result);
    content = content.replace("\"", "").replace("\"", "");
    console.info("OBD DIS - content = ", content);

    // the info save to local storage [ChannelCreation].
    channelInfo = content;

    // Some case do not need displayed.
    if (content === 'already login' || content === 'undefined') return;

    obdMessages += content + '\n\n';
    $("#obd_messages").val(obdMessages);
}

// getUserDataList
function getUserDataList(goWhere) {

    var api_id, description, apiItem, menuDiv;
    var jsonFile = "json/user_data_list.json";

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [user_data_list] div
        var apiList = $("#user_data_list");

        for (let i = 0; i < result.data.length; i++) {
            api_id = result.data[i].id;
            description = result.data[i].description;

            // menuDiv = document.createElement('div');
            // menuDiv.setAttribute('class', 'menuItem');

            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            apiItem.setAttribute('class', 'url');
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'displayUserData(this)');
            apiItem.innerText = api_id;

            // menuDiv.append(apiItem);
            apiList.append(apiItem);

            createElement(apiList, 'p');
        }

        // display User Data in new html page.
        // console.info('goWhere LIST = '+ goWhere);
        if (goWhere) $("#user_data_list").hide();
        switch (goWhere) {
            case 'MnemonicWords':
                displayUserData(MnemonicWords);
                break;
            case 'Addresses':
                displayUserData(Addresses, inNewHtml);
                break;
            case 'Friends':
                displayUserData(Friends);
                break;
            case 'ChannelCreation':
                displayUserData(ChannelCreation, inNewHtml);
                break;
        }
    });
}

// getUtilList
function getUtilList() {
    var jsonFile = "json/util_list.json";
    var divName = "#util_list";

    createLeftSideMenu(jsonFile, divName);
}

// getAPIList
function getAPIList() {
    var jsonFile = "json/api_list.json";
    var divName = "#api_list";

    createLeftSideMenu(jsonFile, divName);
}

// createLeftSideMenu
function createLeftSideMenu(jsonFile, divName) {

    var api_id, type_id, description, apiItem, menuDiv;

    // dynamic create api_list div.
    $.getJSON(jsonFile, function(result) {
        // get [api_list] div
        var apiList = $(divName);

        for (let i = 0; i < result.data.length; i++) {
            api_id = result.data[i].id;
            type_id = result.data[i].type_id;
            description = result.data[i].description;

            menuDiv = document.createElement('div');
            // menuDiv.setAttribute('class', 'menuItem');

            apiItem = document.createElement('a');
            apiItem.id = api_id;
            apiItem.href = '#';
            // apiItem.href = 'javascript:void(0);';
            apiItem.setAttribute('class', 'url');
            apiItem.setAttribute('type_id', type_id);
            apiItem.setAttribute('description', description);
            apiItem.setAttribute('onclick', 'displayAPIContent(this)');
            apiItem.innerText = api_id;

            menuDiv.append(apiItem);
            apiList.append(menuDiv);

            createElement(apiList, 'p');
        }
    });
}

// Invoke a api, show content. Dynamic create content div area.
function displayAPIContent(obj) {
    removeNameReqDiv();
    createApiNameDiv(obj);
    createRequestDiv(obj);
    createInputParamDiv(obj, 'json/util_list.json');
    createInputParamDiv(obj, 'json/api_list.json');
    // createInvokeAPIButton(obj);
}

// create 
function createApiNameDiv(obj) {
    var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [api_name] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', obj.innerHTML);
    newDiv.append(title);

    // create [api_description] element
    createElement(newDiv, 'text', obj.getAttribute("description"));

    content_div.append(newDiv);
}

// create 
function createRequestDiv(obj) {
    var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [title] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'Request');
    newDiv.append(title);
    // createElement(content_div, 'h2', 'Request');

    // create [func_title] element
    createElement(newDiv, 'text', 'func: ', cssStyle);

    // create [func_name] element: id = JS function name.
    createElement(newDiv, 'text', obj.getAttribute("id"));

    // create [type_id] element
    var value = " type ( " + obj.getAttribute("type_id") + " )";
    createElement(newDiv, 'text', value, cssStyle);

    // create [Invoke API] element
    var button = document.createElement('button');
    button.setAttribute('type_id', obj.getAttribute("type_id"));
    button.setAttribute('class', 'button button_big');
    button.setAttribute('onclick', 'invokeAPIs(this)');
    button.innerText = 'Invoke API';
    newDiv.append(button);

    content_div.append(newDiv);
}

// dynamic create input parameters div area.
function createInputParamDiv(obj, jsonFile) {

    $.getJSON(jsonFile, function(result) {
        // get [content] div
        var content_div = $("#name_req_div");

        // get JS function name.
        var js_func = obj.getAttribute("id");

        for (let i = 0; i < result.data.length; i++) {
            // id = js_func, is JS function name.
            if (js_func === result.data[i].id) {
                var arrParams = result.data[i].parameters;
                // console.info('arrParams = ' + arrParams.length);

                // No parameter.
                if (arrParams.length === 0) {
                    break;
                }

                var newDiv = document.createElement('div');
                newDiv.setAttribute('class', 'panelItem');

                var title = document.createElement('div');
                title.setAttribute('class', 'panelTitle');
                createElement(title, 'h2', 'Input Parameters');
                newDiv.append(title);

                // Parameters
                createParamOfAPI(arrParams, newDiv);

                content_div.append(newDiv);
            }
        }

        // display Approval Checkbox
        if (jsonFile === 'json/api_list.json') {
            var msgType = Number(obj.getAttribute("type_id"));
            switch (msgType) {
                case enumMsgType.MsgType_ChannelAccept_N33:
                case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
                case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
                case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                case enumMsgType.MsgType_HTLC_SignGetH_N44:
                case enumMsgType.MsgType_CloseChannelSign_N39:
                    displayApprovalCheckbox(newDiv, obj, msgType);
                    content_div.append(newDiv);
                    break;
            }
        }
    });
}

// display Approval Checkbox
function displayApprovalCheckbox(content_div, obj, msgType) {

    createElement(content_div, 'text', 'Approval ');
    var element = document.createElement('input');
    switch (msgType) {
        case enumMsgType.MsgType_ChannelAccept_N33:
            element.id = 'checkbox_n33';
            break;
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            element.id = 'checkbox_n3500';
            break;
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            element.id = 'checkbox_n35';
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            element.id = 'checkbox_n352';
            break;
        case enumMsgType.MsgType_HTLC_SignGetH_N44:
            element.id = 'checkbox_n44';
            break;
        case enumMsgType.MsgType_CloseChannelSign_N39:
            element.id = 'checkbox_n39';
            break;
    }

    element.type = 'checkbox';
    element.defaultChecked = true;
    element.setAttribute('onclick', 'clickApproval(this)');
    content_div.append(element);
}

// 
function clickApproval(obj) {
    // console.info('clickApproval checked = ' + obj.checked);
    switch (obj.id) {
        case 'checkbox_n33':
            if (obj.checked) {
                $("#funding_pubkey").show();
                $("#funding_pubkeyGet").show();
                $("#funding_pubkeyAut").show();
            } else {
                $("#funding_pubkey").hide();
                $("#funding_pubkeyGet").hide();
                $("#funding_pubkeyAut").hide();
            }
            break;

        case 'checkbox_n3500':
            if (obj.checked) {
                $("#channel_address_private_key").show();
                $("#channel_address_private_keyGet").show();
                // $("#funding_txid").show();
                // $("#funding_txidGet").show();
            } else {
                $("#channel_address_private_key").hide();
                $("#channel_address_private_keyGet").hide();
                // $("#funding_txid").hide();
                // $("#funding_txidGet").hide();
            }
            break;

        case 'checkbox_n35':
            if (obj.checked) {
                $("#fundee_channel_address_private_key").show();
                $("#fundee_channel_address_private_keyGet").show();
            } else {
                $("#fundee_channel_address_private_key").hide();
                $("#fundee_channel_address_private_keyGet").hide();
            }
            break;

        case 'checkbox_n352':
            if (obj.checked) {
                $("#curr_temp_address_pub_key").show();
                $("#curr_temp_address_pub_keyGet").show();
                $("#curr_temp_address_private_key").show();
                $("#curr_temp_address_private_keyGet").show();
                $("#last_temp_address_private_key").show();
                $("#last_temp_address_private_keyGet").show();
                $("#channel_address_private_key").show();
                $("#channel_address_private_keyGet").show();
            } else {
                $("#curr_temp_address_pub_key").hide();
                $("#curr_temp_address_pub_keyGet").hide();
                $("#curr_temp_address_private_key").hide();
                $("#curr_temp_address_private_keyGet").hide();
                $("#last_temp_address_private_key").hide();
                $("#last_temp_address_private_keyGet").hide();
                $("#channel_address_private_key").hide();
                $("#channel_address_private_keyGet").hide();
            }
            break;
        case 'checkbox_n44':
            if (obj.checked) {
                $("#curr_rsmc_temp_address_pub_key").show();
                $("#curr_rsmc_temp_address_pub_keyGet").show();
                $("#curr_rsmc_temp_address_private_key").show();
                $("#curr_rsmc_temp_address_private_keyGet").show();
                $("#curr_htlc_temp_address_pub_key").show();
                $("#curr_htlc_temp_address_pub_keyGet").show();
                $("#curr_htlc_temp_address_private_key").show();
                $("#curr_htlc_temp_address_private_keyGet").show();
                $("#last_temp_address_private_key").show();
                $("#last_temp_address_private_keyGet").show();
                $("#channel_address_private_key").show();
                $("#channel_address_private_keyGet").show();
            } else {
                $("#curr_rsmc_temp_address_pub_key").hide();
                $("#curr_rsmc_temp_address_pub_keyGet").hide();
                $("#curr_rsmc_temp_address_private_key").hide();
                $("#curr_rsmc_temp_address_private_keyGet").hide();
                $("#curr_htlc_temp_address_pub_key").hide();
                $("#curr_htlc_temp_address_pub_keyGet").hide();
                $("#curr_htlc_temp_address_private_key").hide();
                $("#curr_htlc_temp_address_private_keyGet").hide();
                $("#last_temp_address_private_key").hide();
                $("#last_temp_address_private_keyGet").hide();
                $("#channel_address_private_key").hide();
                $("#channel_address_private_keyGet").hide();
            }
            break;

        case 'checkbox_n39':
            if (obj.checked) {
                $("#request_close_channel_hash").show();
                $("#request_close_channel_hashGet").show();
            } else {
                $("#request_close_channel_hash").hide();
                $("#request_close_channel_hashGet").hide();
            }
            break;
    }
}

// create parameter of each API.
function createParamOfAPI(arrParams, content_div) {

    var input_box;

    for (let i = 0; i < arrParams.length; i++) {
        // create [param_title] element
        // var newDiv = document.createElement('div');
        // newDiv.setAttribute('class', 'param');
        createElement(content_div, 'text', arrParams[i].name + ' : ', 'param');
        // content_div.append(newDiv);

        // create [input box of param] element
        input_box = document.createElement('input');
        input_box.id = arrParams[i].name;

        if (arrParams[i].name === 'node_url') {
            input_box.setAttribute('class', 'input_node_url');
        } else {
            input_box.setAttribute('class', 'input');
        }

        content_div.append(input_box);

        createButtonOfParam(arrParams, i, content_div);
        createElement(content_div, 'p');
    }

    // auto fill
    if (arrParams[0].name = 'temporary_channel_id') {
        if (strTempChID) {
            $("#temporary_channel_id").val(strTempChID);
        }
    }

    // Only for fundingBTC api.
    if (arrParams[0].name = 'from_address') {
        if (btcFromAddr) {
            $("#from_address").val(btcFromAddr);
            $("#from_address_private_key").val(btcFromAddrPrivKey);
            $("#to_address").val(btcToAddr);
            $("#amount").val(btcAmount);
            $("#miner_fee").val(btcMinerFee);
        }
    }
}

// create button of parameter
function createButtonOfParam(arrParams, index, content_div) {

    var innerText, invokeFunc;
    var arrButtons = arrParams[index].buttons;

    for (let i = 0; i < arrButtons.length; i++) {
        innerText = arrButtons[i].innerText;
        invokeFunc = arrButtons[i].onclick;

        // create [button] element
        var button = document.createElement('button');
        button.id = arrParams[index].name + innerText.substring(0, 3);
        button.innerText = innerText;
        button.setAttribute('class', 'button button_small');
        button.setAttribute('onclick', invokeFunc);
        content_div.append(button);
    }
}

// 
function createInvokeAPIButton(obj) {
    // get [content] div
    var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    createElement(newDiv, 'p');

    // create [Send button] element
    var button = document.createElement('button');
    // button.id = 'send_button';
    button.setAttribute('type_id', obj.getAttribute("type_id"));
    button.setAttribute('class', 'button');
    button.setAttribute('onclick', 'invokeAPIs(this)');
    button.innerText = 'Invoke API';
    newDiv.append(button);
    content_div.append(newDiv);
}

//----------------------------------------------------------------
// For test to show Connect to OBD html page.
function connectNode() {
    removeNameReqDiv();
    createConnectNodeDiv();
}

// remove name and request Div
function removeNameReqDiv() {
    $("#name_req_div").remove();
    var name_req_div = document.createElement('div');
    name_req_div.id = "name_req_div";
    $("#content").append(name_req_div);
}

// create ConnectNodeDiv
function createConnectNodeDiv() {
    var content_div = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // create [title] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'OBD Node');
    newDiv.append(title);

    // create [input title] element
    createElement(newDiv, 'text', 'Node URL: ', cssStyle);

    // create [input] element
    var node_url = document.createElement('input');
    node_url.id = 'node_url';
    // node_url.style = 'width: 50%';
    node_url.setAttribute('class', 'input_conn_node');
    node_url.placeholder = 'Please input Node URL.';
    // node_url.value = 'ws://62.234.216.108:60030/ws';
    node_url.value = 'ws://127.0.0.1:60020/ws';
    newDiv.append(node_url);

    // create [button] element
    var button = document.createElement('button');
    button.id = 'button_connect';
    button.setAttribute('class', 'button button_small');
    button.setAttribute('onclick', 'clickConnectButton()');
    button.innerText = 'Connect';
    newDiv.append(button);
    
    content_div.append(newDiv);

    // already connected
    if (isConnectToOBD === true) {
        changeConnectButtonStatus();
        createElement(content_div, 'h3', 'Already connected. ' + 
            'Please refresh the page if you want to connect again.');
    }
}

// 
function clickConnectButton() {
    // get [node_url] input box value.
    var node_url = $("#node_url").val();
    console.info('node url = ' + node_url);

    if (node_url.trim().length === 0) {
        alert('Please input Node URL.');
        return;
    }

    obdApi.connectToServer(node_url, function(response) {
        console.info('OBD Response = ' + response);

        $("#status").text("Connected");
        isConnectToOBD = true; // already connected.

        createOBDResponseDiv(response, 'connect_node_resp');
        changeConnectButtonStatus();

    }, function(globalResponse) {
        displayOBDMessages(globalResponse);
    });
}

//
function changeConnectButtonStatus() {
    $("#button_connect").remove();
    // var button_connect = $("#button_connect");
    // button_connect.text("Disconnect");
    // button_connect.attr("disabled", "disabled");
}

// create OBD Response Div 
function createOBDResponseDiv(response, msgType) {

    $("#newDiv").remove();
    $("#obd_response_div").remove();

    var newDiv = document.createElement('div');
    newDiv.id = "newDiv";
    newDiv.setAttribute('class', 'panelItem');

    var obd_response_div = document.createElement('div');
    obd_response_div.id = "obd_response_div";

    // create [title] element
    var title = document.createElement('div');
    title.setAttribute('class', 'panelTitle');
    createElement(title, 'h2', 'OBD Response');
    newDiv.append(title);

    newDiv.append(obd_response_div);
    $("#name_req_div").append(newDiv);

    switch (msgType) {
        case 'connect_node_resp':
            var msg = response + '. Please refresh the page if you want to connect again.';
            createElement(obd_response_div, 'p', msg);
            break;
        case enumMsgType.MsgType_Core_Omni_Getbalance_1200:
            parseData1200(response);
            break;
        case enumMsgType.MsgType_CommitmentTx_AllBRByChanId_N35109:
            parseDataN35109(response);
            break;
        case enumMsgType.MsgType_GetChannelInfoByChanId_N3207:
            parseDataN3207(response);
            break;
        case enumMsgType.MsgType_ChannelOpen_AllItem_N3202:
            parseDataN3202(response);
            break;
        case enumMsgType.MsgType_CommitmentTx_ItemsByChanId_N35101:
            parseDataN35101(response);
            break;
        case enumMsgType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_N35104:
            parseDataN35104(response);
            break;
        case enumMsgType.MsgType_Mnemonic_CreateAddress_N200:
        case enumMsgType.MsgType_Mnemonic_GetAddressByIndex_201:
            parseDataN200(response);
            break;
        case enumMsgType.MsgType_ChannelOpen_N32:
            parseDataN32(response);
            break;
        case enumMsgType.MsgType_ChannelAccept_N33:
            parseDataN33(response);
            break;
        case enumMsgType.MsgType_Core_FundingBTC_1009:
            parseData1009(response);
            break;
        case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
            parseDataN3400(response);
            break;
        case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
            parseDataN3500(response);
            break;
        case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
            parseData2001(response);
            break;
        case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
            parseDataN34(response);
            break;
        case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
            parseDataN35(response);
            break;
        case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
            parseDataN351(response);
            break;
        case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
            parseDataN352(response);
            break;
        case enumMsgType.MsgType_HTLC_Invoice_N4003:
            parseDataN4003(response);
            break;
        case enumMsgType.MsgType_HTLC_AddHTLC_N40:
            parseDataN40(response);
            break;
        case enumMsgType.MsgType_HTLC_FindPathAndSendH_N42:
            parseDataN42(response);
            break;
        case enumMsgType.MsgType_HTLC_SendH_N43:
            parseDataN43(response);
            break;
        case enumMsgType.MsgType_HTLC_SignGetH_N44:
            parseDataN44(response);
            break;
        case enumMsgType.MsgType_HTLC_CreateCommitmentTx_N45:
            parseDataN45(response);
            break;
        case enumMsgType.MsgType_HTLC_SendR_N46:
            parseDataN46(response);
            break;
        case enumMsgType.MsgType_HTLC_VerifyR_N47:
            parseDataN47(response);
            break;
        case enumMsgType.MsgType_HTLC_RequestCloseCurrTx_N48:
            parseDataN48(response);
            break;
        case enumMsgType.MsgType_HTLC_CloseSigned_N49:
            parseDataN49(response);
            break;
        case enumMsgType.MsgType_CloseChannelRequest_N38:
            parseDataN38(response);
            break;
        case enumMsgType.MsgType_CloseChannelSign_N39:
            parseDataN39(response);
            break;
        case enumMsgType.MsgType_Atomic_Swap_N80:
            parseDataN80(response);
            break;
        case enumMsgType.MsgType_Atomic_Swap_Accept_N81:
            parseDataN81(response);
            break;
        case enumMsgType.MsgType_UserLogin_1:
            parseData1(response);
            break;
        case enumMsgType.MsgType_p2p_ConnectServer_3:
            parseData3(response);
            break;
        default:
            createElement(obd_response_div, 'p', response);
            break;
    }
}

//----------------------------------------------------------------
// Functions of processing each response from invoke APIs.

// parseData3 - 
function parseData3(response) {
    var arrData = [
        'Connect success.',
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i], 'responseText');
    }
}

// parseData1 - 
function parseData1(response) {
    if (isLogined) {
        var arrData = [
            'Status : ' + response,
        ];
    } else {
        var arrData = [
            'p2pNodeAddress : ' + response.p2pNodeAddress,
            'p2pNodePeerId : '  + response.p2pNodePeerId,
            'userPeerId : '     + response.userPeerId,
        ];
    }

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN81 - 
function parseDataN81(response) {
    var arrData = [
        // 'channel_id : ' + response.channel_id,
        // 'request_close_channel_hash : ' + response.request_close_channel_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseDataN80 - 
function parseDataN80(response) {
    var arrData = [
        // 'channel_id : ' + response.channel_id,
        // 'request_close_channel_hash : ' + response.request_close_channel_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        createElement(obd_response_div, 'p', arrData[i]);
    }
}

// parseData1200 - 
function parseData1200(response) {

    var arrData;

    createElement(obd_response_div, 'p', 'Total Count = ' + response.length);

    for (let i = 0; i < response.length; i++) {
        arrData = [
            'balance : ' + response[i].balance,
            'frozen : ' + response[i].frozen,
            'name : ' + response[i].name,
            'propertyid : ' + response[i].propertyid,
            'reserved : ' + response[i].reserved,
        ];
        
        createElement(obd_response_div, 'h4', 'NO. ' + (i + 1), 'responseText');

        for (let i2 = 0; i2 < arrData.length; i2++) {
            var point   = arrData[i2].indexOf(':') + 1;
            var title   = arrData[i2].substring(0, point);
            var content = arrData[i2].substring(point);
            createElement(obd_response_div, 'text', title);
            createElement(obd_response_div, 'p', content, 'responseText');
        }
    }
}

// parseDataN3207 - 
function parseDataN3207(response) {
    var arrData = [
        'accept_at : ' + response.accept_at,
        'address_a : ' + response.address_a,
        'address_b : ' + response.address_b,
        'chain_hash : ' + response.chain_hash,
        'channel_address : ' + response.channel_address,
        'channel_address_redeem_script : ' + response.channel_address_redeem_script,
        'channel_address_script_pub_key : ' + response.channel_address_script_pub_key,
        'channel_id : ' + response.channel_id,
        'channel_reserve_satoshis : ' + response.channel_reserve_satoshis,
        'close_at : ' + response.close_at,
        'create_at : ' + response.create_at,
        'create_by : ' + response.create_by,
        'curr_state : ' + response.curr_state,
        'delayed_payment_base_point : ' + response.delayed_payment_base_point,
        'dust_limit_satoshis : ' + response.dust_limit_satoshis,
        'fee_rate_per_kw : ' + response.fee_rate_per_kw,
        'funding_address : ' + response.funding_address,
        'funding_pubkey : ' + response.funding_pubkey,
        'funding_satoshis : ' + response.funding_satoshis,
        'htlc_base_point : ' + response.htlc_base_point,
        'htlc_minimum_msat : ' + response.htlc_minimum_msat,
        'id : ' + response.id,
        'max_accepted_htlcs : ' + response.max_accepted_htlcs,
        'max_htlc_value_in_flight_msat : ' + response.max_htlc_value_in_flight_msat,
        'payment_base_point : ' + response.payment_base_point,
        'peer_id_a : ' + response.peer_id_a,
        'peer_id_b : ' + response.peer_id_b,
        'property_id : ' + response.property_id,
        'pub_key_a : ' + response.pub_key_a,
        'pub_key_b : ' + response.pub_key_b,
        'push_msat : ' + response.push_msat,
        'revocation_base_point : ' + response.revocation_base_point,
        'temporary_channel_id : ' + response.temporary_channel_id,
        'to_self_delay : ' + response.to_self_delay,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN3202 - 
function parseDataN3202(response) {

    var arrData;

    createElement(obd_response_div, 'p', 'Total Count = ' + response.count);

    for (let i = 0; i < response.body.length; i++) {
        arrData = [
            'accept_at : ' + response.body[i].accept_at,
            'address_a : ' + response.body[i].address_a,
            'address_b : ' + response.body[i].address_b,
            'chain_hash : ' + response.body[i].chain_hash,
            'channel_address : ' + response.body[i].channel_address,
            'channel_address_redeem_script : ' + response.body[i].channel_address_redeem_script,
            'channel_address_script_pub_key : ' + response.body[i].channel_address_script_pub_key,
            'channel_id : ' + response.body[i].channel_id,
            'channel_reserve_satoshis : ' + response.body[i].channel_reserve_satoshis,
            'close_at : ' + response.body[i].close_at,
            'create_at : ' + response.body[i].create_at,
            'create_by : ' + response.body[i].create_by,
            'curr_state : ' + response.body[i].curr_state,
            'delayed_payment_base_point : ' + response.body[i].delayed_payment_base_point,
            'dust_limit_satoshis : ' + response.body[i].dust_limit_satoshis,
            'fee_rate_per_kw : ' + response.body[i].fee_rate_per_kw,
            'funding_address : ' + response.body[i].funding_address,
            'funding_pubkey : ' + response.body[i].funding_pubkey,
            'funding_satoshis : ' + response.body[i].funding_satoshis,
            'htlc_base_point : ' + response.body[i].htlc_base_point,
            'htlc_minimum_msat : ' + response.body[i].htlc_minimum_msat,
            'id : ' + response.body[i].id,
            'max_accepted_htlcs : ' + response.body[i].max_accepted_htlcs,
            'max_htlc_value_in_flight_msat : ' + response.body[i].max_htlc_value_in_flight_msat,
            'payment_base_point : ' + response.body[i].payment_base_point,
            'peer_id_a : ' + response.body[i].peer_id_a,
            'peer_id_b : ' + response.body[i].peer_id_b,
            'property_id : ' + response.body[i].property_id,
            'pub_key_a : ' + response.body[i].pub_key_a,
            'pub_key_b : ' + response.body[i].pub_key_b,
            'push_msat : ' + response.body[i].push_msat,
            'revocation_base_point : ' + response.body[i].revocation_base_point,
            'temporary_channel_id : ' + response.body[i].temporary_channel_id,
            'to_self_delay : ' + response.body[i].to_self_delay,
        ];

        createElement(obd_response_div, 'h4', 'NO. ' + (i + 1));

        for (let i2 = 0; i2 < arrData.length; i2++) {
            var point   = arrData[i2].indexOf(':') + 1;
            var title   = arrData[i2].substring(0, point);
            var content = arrData[i2].substring(point);
            createElement(obd_response_div, 'text', title);
            createElement(obd_response_div, 'p', content, 'responseText');
        }
    }
}

// parseDataN35109 - 
function parseDataN35109(response) {

    var arrData;

    createElement(obd_response_div, 'p', 'Total Count = ' + response.length);

    for (let i = 0; i < response.length; i++) {
        arrData = [
            'channel_id : ' + response[i].channel_id,
            'amount : ' + response[i].amount,
            'commitment_tx_id : ' + response[i].commitment_tx_id,
            'create_at : ' + response[i].create_at,
            'create_by : ' + response[i].create_by,
            'curr_state : ' + response[i].curr_state,
            'id : ' + response[i].id,
            'input_amount : ' + response[i].input_amount,
            'input_txid : ' + response[i].input_txid,
            'input_vout : ' + response[i].input_vout,
            'last_edit_time : ' + response[i].last_edit_time,
            'owner : ' + response[i].owner,
            'peer_id_a : ' + response[i].peer_id_a,
            'peer_id_b : ' + response[i].peer_id_b,
            'property_id : ' + response[i].property_id,
            'send_at : ' + response[i].send_at,
            'sign_at : ' + response[i].sign_at,
            'transaction_sign_hex : ' + response[i].transaction_sign_hex,
            'txid : ' + response[i].txid,
        ];

        createElement(obd_response_div, 'h4', 'NO. ' + (i + 1));

        for (let i2 = 0; i2 < arrData.length; i2++) {
            var point   = arrData[i2].indexOf(':') + 1;
            var title   = arrData[i2].substring(0, point);
            var content = arrData[i2].substring(point);
            createElement(obd_response_div, 'text', title);
            createElement(obd_response_div, 'p', content, 'responseText');
        }
    }
}

// parseDataN35101 - 
function parseDataN35101(response) {

    var arrData;

    createElement(obd_response_div, 'p', 'Total Count = ' + response.totalCount);

    for (let i = 0; i < response.body.length; i++) {
        arrData = [
            'channel_id : ' + response.body[i].channel_id,
            'amount_to_htlc : ' + response.body[i].amount_to_htlc,
            'amount_to_other : ' + response.body[i].amount_to_other,
            'amount_to_rsmc : ' + response.body[i].amount_to_rsmc,
            'create_at : ' + response.body[i].create_at,
            'create_by : ' + response.body[i].create_by,
            'curr_hash : ' + response.body[i].curr_hash,
            'curr_state : ' + response.body[i].curr_state,
            'htlc_h : ' + response.body[i].htlc_h,
            'htlc_multi_address : ' + response.body[i].htlc_multi_address,
            'htlc_multi_address_script_pub_key : ' + response.body[i].htlc_multi_address_script_pub_key,
            'htlc_r : ' + response.body[i].htlc_r,
            'htlc_redeem_script : ' + response.body[i].htlc_redeem_script,
            'htlc_sender : ' + response.body[i].htlc_sender,
            'htlc_temp_address_pub_key : ' + response.body[i].htlc_temp_address_pub_key,
            'htlc_tx_hash : ' + response.body[i].htlc_tx_hash,
            'htlc_txid : ' + response.body[i].htlc_txid,
            'id : ' + response.body[i].id,
            'input_amount : ' + response.body[i].input_amount,
            'input_txid : ' + response.body[i].input_txid,
            'input_vout : ' + response.body[i].input_vout,
            'last_commitment_tx_id : ' + response.body[i].last_commitment_tx_id,
            'last_edit_time : ' + response.body[i].last_edit_time,
            'last_hash : ' + response.body[i].last_hash,
            'owner : ' + response.body[i].owner,
            'peer_id_a : ' + response.body[i].peer_id_a,
            'peer_id_b : ' + response.body[i].peer_id_b,
            'property_id : ' + response.body[i].property_id,
            'rsmc_multi_address : ' + response.body[i].rsmc_multi_address,
            'rsmc_multi_address_script_pub_key : ' + response.body[i].rsmc_multi_address_script_pub_key,
            'rsmc_redeem_script : ' + response.body[i].rsmc_redeem_script,
            'rsmc_temp_address_pub_key : ' + response.body[i].rsmc_temp_address_pub_key,
            'rsmc_tx_hash : ' + response.body[i].rsmc_tx_hash,
            'rsmc_txid : ' + response.body[i].rsmc_txid,
            'send_at : ' + response.body[i].send_at,
            'sign_at : ' + response.body[i].sign_at,
            'to_other_tx_hash : ' + response.body[i].to_other_tx_hash,
            'to_other_txid : ' + response.body[i].to_other_txid,
            'tx_type : ' + response.body[i].tx_type,
        ];

        createElement(obd_response_div, 'h4', 'NO. ' + (i + 1));

        for (let i2 = 0; i2 < arrData.length; i2++) {
            var point   = arrData[i2].indexOf(':') + 1;
            var title   = arrData[i2].substring(0, point);
            var content = arrData[i2].substring(point);
            createElement(obd_response_div, 'text', title);
            createElement(obd_response_div, 'p', content, 'responseText');
        }
    }
}

// parseDataN35104 - 
function parseDataN35104(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'amount_to_htlc : ' + response.amount_to_htlc,
        'amount_to_other : ' + response.amount_to_other,
        'amount_to_rsmc : ' + response.amount_to_rsmc,
        'create_at : ' + response.create_at,
        'create_by : ' + response.create_by,
        'curr_hash : ' + response.curr_hash,
        'curr_state : ' + response.curr_state,
        'htlc_h : ' + response.htlc_h,
        'htlc_multi_address : ' + response.htlc_multi_address,
        'htlc_multi_address_script_pub_key : ' + response.htlc_multi_address_script_pub_key,
        'htlc_r : ' + response.htlc_r,
        'htlc_redeem_script : ' + response.htlc_redeem_script,
        'htlc_sender : ' + response.htlc_sender,
        'htlc_temp_address_pub_key : ' + response.htlc_temp_address_pub_key,
        'htlc_tx_hash : ' + response.htlc_tx_hash,
        'htlc_txid : ' + response.htlc_txid,
        'id : ' + response.id,
        'input_amount : ' + response.input_amount,
        'input_txid : ' + response.input_txid,
        'input_vout : ' + response.input_vout,
        'last_commitment_tx_id : ' + response.last_commitment_tx_id,
        'last_edit_time : ' + response.last_edit_time,
        'last_hash : ' + response.last_hash,
        'owner : ' + response.owner,
        'peer_id_a : ' + response.peer_id_a,
        'peer_id_b : ' + response.peer_id_b,
        'property_id : ' + response.property_id,
        'rsmc_multi_address : ' + response.rsmc_multi_address,
        'rsmc_multi_address_script_pub_key : ' + response.rsmc_multi_address_script_pub_key,
        'rsmc_redeem_script : ' + response.rsmc_redeem_script,
        'rsmc_temp_address_pub_key : ' + response.rsmc_temp_address_pub_key,
        'rsmc_tx_hash : ' + response.rsmc_tx_hash,
        'rsmc_txid : ' + response.rsmc_txid,
        'send_at : ' + response.send_at,
        'sign_at : ' + response.sign_at,
        'to_other_tx_hash : ' + response.to_other_tx_hash,
        'to_other_txid : ' + response.to_other_txid,
        'tx_type : ' + response.tx_type,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN39 - 
function parseDataN39(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'request_close_channel_hash : ' + response.request_close_channel_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN38 - 
function parseDataN38(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'request_close_channel_hash : ' + response.request_close_channel_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN49 - 
function parseDataN49(response) {
    var arrData = [
        'msg : ' + response.msg,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN48 - 
function parseDataN48(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'create_at : ' + response.create_at,
        'create_by : ' + response.create_by,
        'curr_rsmc_temp_address_pub_key : ' + response.curr_rsmc_temp_address_pub_key,
        'curr_state : ' + response.curr_state,
        'id : ' + response.id,
        'request_hash : ' + response.request_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN47 - 
function parseDataN47(response) {
    var arrData = [
        'r : ' + response.r,
        'request_hash : ' + response.request_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN46 - 
function parseDataN46(response) {
    var arrData = [
        'id : ' + response.id,
        'r : ' + response.r,
        'request_hash : ' + response.request_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN45 - 
function parseDataN45(response) {
    var arrData = [
        'h : ' + response.h,
        'request_hash : ' + response.request_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN44 - 
function parseDataN44(response) {
    var arrData = [
        'approval : ' + response.approval,
        'channelId : ' + response.channelId,
        'request_hash : ' + response.request_hash,
        'sender : ' + response.sender,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN42 - 
function parseDataN42(response) {
    var arrData = [
        'channelId : ' + response.channelId,
        'h : ' + response.h,
        'request_hash : ' + response.request_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN43 - 
function parseDataN43(response) {
    var arrData = [
        'h : ' + response.h,
        'request_hash : ' + response.request_hash,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN40 - 
function parseDataN40(response) {
    var arrData = [
        'recipient_peer_id : ' + response.recipient_peer_id,
        'amount : ' + response.amount,
        'property_id : ' + response.propertyId,
        'msg : ' + response.msg,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN4003 - 
function parseDataN4003(response) {
    var arrData = [
        'recipient_peer_id : ' + response.recipient_peer_id,
        'amount : ' + response.amount,
        'property_id : ' + response.propertyId,
        'msg : ' + response.msg,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN352 - 
function parseDataN352(response) {

    var arrData = [
        'channel_id : ' + response.latestCcommitmentTxInfo.channel_id,
        'property_id : ' + response.latestCcommitmentTxInfo.property_id,
        'amount_to_htlc : ' + response.latestCcommitmentTxInfo.amount_to_htlc,
        'amount_to_other : ' + response.latestCcommitmentTxInfo.amount_to_other,
        'amount_to_rsmc : ' + response.latestCcommitmentTxInfo.amount_to_rsmc,
        'create_at : ' + response.latestCcommitmentTxInfo.create_at,
        'create_by : ' + response.latestCcommitmentTxInfo.create_by,
        'curr_hash : ' + response.latestCcommitmentTxInfo.curr_hash,
        'curr_state : ' + response.latestCcommitmentTxInfo.curr_state,
        'htlc_h : ' + response.latestCcommitmentTxInfo.htlc_h,
        'htlc_multi_address : ' + response.latestCcommitmentTxInfo.htlc_multi_address,
        'htlc_multi_address_script_pub_key : ' + response.latestCcommitmentTxInfo.htlc_multi_address_script_pub_key,
        'htlc_r : ' + response.latestCcommitmentTxInfo.htlc_r,
        'htlc_redeem_script : ' + response.latestCcommitmentTxInfo.htlc_redeem_script,
        'htlc_sender : ' + response.latestCcommitmentTxInfo.htlc_sender,
        'htlc_temp_address_pub_key : ' + response.latestCcommitmentTxInfo.htlc_temp_address_pub_key,
        'htlc_tx_hex : ' + response.latestCcommitmentTxInfo.htlc_tx_hex,
        'htlc_txid : ' + response.latestCcommitmentTxInfo.htlc_txid,
        'id : ' + response.latestCcommitmentTxInfo.id,
        'input_amount : ' + response.latestCcommitmentTxInfo.input_amount,
        'input_txid : ' + response.latestCcommitmentTxInfo.input_txid,
        'input_vout : ' + response.latestCcommitmentTxInfo.input_vout,
        'last_commitment_tx_id : ' + response.latestCcommitmentTxInfo.last_commitment_tx_id,
        'last_edit_time : ' + response.latestCcommitmentTxInfo.last_edit_time,
        'last_hash : ' + response.latestCcommitmentTxInfo.last_hash,
        'owner : ' + response.latestCcommitmentTxInfo.owner,
        'peer_id_a : ' + response.latestCcommitmentTxInfo.peer_id_a,
        'peer_id_b : ' + response.latestCcommitmentTxInfo.peer_id_b,
        'rsmc_input_txid : ' + response.latestCcommitmentTxInfo.rsmc_input_txid,
        'rsmc_multi_address : ' + response.latestCcommitmentTxInfo.rsmc_multi_address,
        'rsmc_multi_address_script_pub_key : ' + response.latestCcommitmentTxInfo.rsmc_multi_address_script_pub_key,
        'rsmc_redeem_script : ' + response.latestCcommitmentTxInfo.rsmc_redeem_script,
        'rsmc_temp_address_pub_key : ' + response.latestCcommitmentTxInfo.rsmc_temp_address_pub_key,
        'rsmc_tx_hex : ' + response.latestCcommitmentTxInfo.rsmc_tx_hex,
        'rsmc_txid : ' + response.latestCcommitmentTxInfo.rsmc_txid,
        'send_at : ' + response.latestCcommitmentTxInfo.send_at,
        'sign_at : ' + response.latestCcommitmentTxInfo.ign_at,
        'to_other_tx_hex : ' + response.latestCcommitmentTxInfo.to_other_tx_hex,
        'to_other_txid : ' + response.latestCcommitmentTxInfo.to_other_txid,
        'tx_type : ' + response.latestCcommitmentTxInfo.tx_type,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN351 - 
function parseDataN351(response) {
    var arrData = [
        // TO BOB INFO
        // 'channelId : ' + response.channelId,
        // 'amount : ' + response.amount,
        // 'msgHash : ' + response.msgHash,
        // 'rsmcHex : ' + response.rsmcHex,
        // 'toOtherHex : ' + response.toOtherHex,
        
        // ALICE LOOK INFO
        'channelId : ' + response.channelId,
        'amount : ' + response.amount,
        'commitmentHash : ' + response.commitmentHash,
        'currTempAddressPubKey : ' + response.currTempAddressPubKey,
        'lastTempAddressPrivateKey : ' + response.lastTempAddressPrivateKey,
        'rsmcHex : ' + response.rsmcHex,
        'toOtherHex : ' + response.toOtherHex,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN34 - 
function parseDataN34(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'temporary_channel_id : ' + response.temporary_channel_id,
        'c1a_rsmc_hex : ' + response.c1a_rsmc_hex,
        'funding_omni_hex : ' + response.funding_omni_hex,
        'rsmc_temp_address_pub_key : ' + response.rsmc_temp_address_pub_key,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN35 - 
function parseDataN35(response) {
    var arrData = [
        'channel_id : ' + response.channel_id,
        'rd_hex : ' + response.rd_hex,
        'rsmc_signed_hex : ' + response.rsmc_signed_hex,
        'approval : ' + response.approval,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN2001 - 
function parseData2001(response) {
    var arrData = [
        'hex : ' + response.hex,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN3500 - 
function parseDataN3500(response) {
    var arrData = [
        // 'channel_id : ' + response.channel_id,
        // 'temporary_channel_id : ' + response.temporary_channel_id,
        // 'create_at : ' + response.create_at,
        // 'id : ' + response.id,
        // 'owner : ' + response.owner,
        // 'txid : ' + response.txid,
        // 'tx_hash : ' + response.tx_hash,

        'approval : ' + response.approval,
        'funding_redeem_hex : ' + response.funding_redeem_hex,
        'funding_txid : ' + response.funding_txid,
        'temporary_channel_id : ' + response.temporary_channel_id,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN3400 - 
function parseDataN3400(response) {
    var arrData = [
        'temporary_channel_id : ' + response.temporary_channel_id,
        'funding_txid : ' + response.funding_txid,
        'funding_btc_hex : ' + response.funding_btc_hex,
        'funding_redeem_hex : ' + response.funding_redeem_hex,
        // 'amount : ' + response.amount,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseData1009 - 
function parseData1009(response) {
    var arrData = [
        'hex : ' + response.hex,
        'txid : ' + response.txid,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// parseDataN200 - getNewAddressWithMnemonic
function parseDataN200(response) {
    var arrData = [
        'ADDRESS : ' + response.result.address,
        'INDEX : ' + response.result.index,
        'PUB_KEY : ' + response.result.pubkey,
        'WIF : ' + response.result.wif
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// processing -32 openChannel data.
function parseDataN32(response) {
    var arrData = [
        'chain_hash : ' + response.chain_hash,
        'channel_reserve_satoshis : ' + response.channel_reserve_satoshis,
        'delayed_payment_base_point : ' + response.delayed_payment_base_point,
        'dust_limit_satoshis : ' + response.dust_limit_satoshis,
        'fee_rate_per_kw : ' + response.fee_rate_per_kw,
        'funding_address : ' + response.funding_address,
        'funding_pubkey : ' + response.funding_pubkey,
        'funding_satoshis : ' + response.funding_satoshis,
        'htlc_base_point : ' + response.htlc_base_point,
        'htlc_minimum_msat : ' + response.htlc_minimum_msat,
        'max_accepted_htlcs : ' + response.max_accepted_htlcs,
        'max_htlc_value_in_flight_msat : ' + response.max_htlc_value_in_flight_msat,
        'payment_base_point : ' + response.payment_base_point,
        'push_msat : ' + response.push_msat,
        'revocation_base_point : ' + response.revocation_base_point,
        'temporary_channel_id : ' + response.temporary_channel_id,
        'to_self_delay : ' + response.to_self_delay,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// processing -33 Accept Channel data.
function parseDataN33(response) {
    // curr_state = 20 is accept open channel request.
    // curr_state = 30 is NOT accept open channel request.
    var arrData = [
        'accept_at : ' + response.accept_at,
        'address_a : ' + response.address_a,
        'address_b : ' + response.address_b,
        'chain_hash : ' + response.chain_hash,
        'channel_address : ' + response.channel_address,
        'channel_address_redeem_script : ' + response.channel_address_redeem_script,
        'channel_address_script_pub_key : ' + response.channel_address_script_pub_key,
        'channel_id : ' + response.channel_id,
        'channel_reserve_satoshis : ' + response.channel_reserve_satoshis,
        'close_at : ' + response.close_at,
        'create_at : ' + response.create_at,
        'create_by : ' + response.create_by,
        'curr_state : ' + response.curr_state,
        'delayed_payment_base_point : ' + response.delayed_payment_base_point,
        'dust_limit_satoshis : ' + response.dust_limit_satoshis,
        'fee_rate_per_kw : ' + response.fee_rate_per_kw,
        'funding_address : ' + response.funding_address,
        'funding_pubkey : ' + response.funding_pubkey,
        'funding_satoshis : ' + response.funding_satoshis,
        'htlc_base_point : ' + response.htlc_base_point,
        'htlc_minimum_msat : ' + response.htlc_minimum_msat,
        'id : ' + response.id,
        'max_accepted_htlcs : ' + response.max_accepted_htlcs,
        'max_htlc_value_in_flight_msat : ' + response.max_htlc_value_in_flight_msat,
        'payment_base_point : ' + response.payment_base_point,
        'peer_id_a : ' + response.peer_id_a,
        'peer_id_b : ' + response.peer_id_b,
        'pub_key_a : ' + response.pub_key_a,
        'pub_key_b : ' + response.pub_key_b,
        'push_msat : ' + response.push_msat,
        'revocation_base_point : ' + response.revocation_base_point,
        'temporary_channel_id : ' + response.temporary_channel_id,
        'to_self_delay : ' + response.to_self_delay,
    ];

    for (let i = 0; i < arrData.length; i++) {
        var point   = arrData[i].indexOf(':') + 1;
        var title   = arrData[i].substring(0, point);
        var content = arrData[i].substring(point);
        createElement(obd_response_div, 'text', title);
        createElement(obd_response_div, 'p', content, 'responseText');
    }
}

// get a new index of address
function getNewAddrIndex() {

    var addr = JSON.parse(localStorage.getItem(saveAddr));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
                maxIndex = addr.result[i].data.length - 1;
                newIndex = addr.result[i].data[maxIndex].index + 1;
                return newIndex;
            }
        }

        // A new User ID.
        return 1;

    } else {
        // console.info('FIRST DATA');
        return 1;
    }
}

// Address data generated with mnemonic save to local storage.
function saveAddrData(response) {

    var addr = JSON.parse(localStorage.getItem(saveAddr));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (addr) {
        // console.info('HAS DATA');
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
                // Add new dato to 
                let new_data = {
                    address: response.result.address,
                    index: response.result.index,
                    pubkey: response.result.pubkey,
                    wif: response.result.wif
                }
                addr.result[i].data.push(new_data);
                localStorage.setItem(saveAddr, JSON.stringify(addr));
                return;
            }
        }

        // A new User ID.
        let new_data = {
            userID: userID,
            data: [{
                address: response.result.address,
                index: response.result.index,
                pubkey: response.result.pubkey,
                wif: response.result.wif
            }]
        }
        addr.result.push(new_data);
        localStorage.setItem(saveAddr, JSON.stringify(addr));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                userID: userID,
                data: [{
                    address: response.result.address,
                    index: response.result.index,
                    pubkey: response.result.pubkey,
                    wif: response.result.wif
                }]
            }]
        }
        localStorage.setItem(saveAddr, JSON.stringify(data));
    }
}

// Record full flow channel data.
function channelData(response) {

    var data = {
        channelInfo: channelInfo,
        create_at: response.create_at,
        create_by: response.create_by,
        accept_at: response.accept_at,
        address_a: response.address_a,
        address_b: response.address_b,
        channel_address: response.channel_address,
        temporary_channel_id: response.temporary_channel_id,

        request_close_channel_hash: response.request_close_channel_hash,
        date: new Date().toLocaleString(),
    }

    return data;
}

// Depositing btc record.
function btcData(response, msgType) {
    var btc = {
        from_address: $("#from_address").val(),
        amount: $("#amount").val(),
        hex: response.hex,
        txid: response.txid,
        date: new Date().toLocaleString(),
        msgType: msgType,
    }
    return btc;
}

// transfer (HTLC) record.
function htlcData(response, msgType, info) {
    if (info) {
        var data = {
            channelId: response.channelId,
            h: response.h,
            r: '',
            request_hash: response.request_hash,
            date: new Date().toLocaleString(),
            msgType: msgType,

            property_id: info.property_id,
            amount: info.amount,
            memo: info.memo,

            curr_state: '',
            sender: '',
            approval: '',
        }
    } else {
        var data = {
            channel_id: response.channel_id,
            create_at: response.create_at,
            create_by: response.create_by,
            curr_state: response.curr_state,
            request_hash: response.request_hash,
            date: new Date().toLocaleString(),
            msgType: msgType,
        }
    }

    return data;
}

//
function updateHtlcData(response, data, msgType) {
    data.msgType = msgType;
    data.date = new Date().toLocaleString();
    data.request_hash = response.request_hash;
    data.sender = response.sender;
    data.approval = response.approval;
}

// transfer (RSMC) record.
function rsmcData(response, msgType) {
    var data = {
        // to bob
        channelId: response.channelId,
        amount: response.amount,
        msgHash: response.msgHash,
        rsmcHex: response.rsmcHex,
        toOtherHex: response.toOtherHex,

        // to alice
        // channelId: response.channelId,
        // amount: response.amount,
        // commitmentHash: response.commitmentHash,
        // currTempAddressPubKey: response.currTempAddressPubKey,
        // lastTempAddressPrivateKey: response.lastTempAddressPrivateKey,
        // rsmcHex: response.rsmcHex,
        // toOtherHex: response.toOtherHex,

        date: new Date().toLocaleString(),
        msgType: msgType,
    }

    return data;
}

//
function updateRsmcData(response, data, msgType) {
    data.msgType = msgType;
    data.date = new Date().toLocaleString();

    // data.amount_to_htlc = response.amount_to_htlc;
    // data.amount_to_other = response.amount_to_other;
    // data.amount_to_rsmc = response.amount_to_rsmc;
    // data.rsmc_multi_address = response.rsmc_multi_address;
    // data.rsmc_txid = response.rsmc_txid;
    // data.send_at = response.send_at;
    // data.sign_at = response.sign_at;
    // data.to_other_txid = response.to_other_txid;
}

// Depositing omni assets record.
function omniAssetData(response, msgType) {
    var omniAsset = {
        from_address: $("#from_address").val(),
        amount: $("#amount").val(),
        property_id: $("#property_id").val(),
        hex: response.hex,
        date: new Date().toLocaleString(),
        msgType: msgType,

        // -34 response
        channel_id: '',
        temporary_channel_id: '',
        funding_omni_hex: '',
        rsmc_temp_address_pub_key: '',
        c1a_rsmc_hex: '',
        
        // -35 response
        approval: '',
        rd_hex: '',
        rsmc_signed_hex: '',
    }

    return omniAsset;
}

// 
function dataConstruct(response, tempChID, msgType) {
    var data;
    if (msgType) {
        data = {
            temporary_channel_id: tempChID,
            userID: userID,
            data: [channelData(response)],
            btc: [btcData(response, msgType)],
            omniAsset: [omniAssetData(response, msgType)],
            transfer: [],
            htlc: [],
        }
    } else {
        data = {
            temporary_channel_id: tempChID,
            userID: userID,
            data: [channelData(response)],
            btc: [],
            omniAsset: [],
            transfer: [],
            htlc: [],
        }
    }

    return data;
}

// Non-finalized channel information.
function saveChannelCreation(response, channelID, msgType, info) {
    var chID;
    var list = JSON.parse(localStorage.getItem(saveTempCI));

    if (response.temporary_channel_id) {
        chID = response.temporary_channel_id;
    } else {
        chID = channelID;
    }

    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            if (chID === list.result[i].temporary_channel_id) {
                switch (msgType) {
                    case enumMsgType.MsgType_HTLC_FindPathAndSendH_N42:
                        list.result[i].htlc.push(htlcData(response, msgType, info));
                        break;
                    case enumMsgType.MsgType_HTLC_SignGetH_N44:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_hash").val() === list.result[i].htlc[i2].request_hash) {
                                updateHtlcData(response, list.result[i].htlc[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_HTLC_CreateCommitmentTx_N45:
                    case enumMsgType.MsgType_HTLC_VerifyR_N47:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_hash").val() === list.result[i].htlc[i2].request_hash) {
                                list.result[i].htlc[i2].request_hash = response.request_hash;
                                list.result[i].htlc[i2].msgType = msgType;
                                list.result[i].htlc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_HTLC_SendR_N46:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_hash").val() === list.result[i].htlc[i2].request_hash) {
                                list.result[i].htlc[i2].r = response.r;
                                list.result[i].htlc[i2].request_hash = response.request_hash;
                                list.result[i].htlc[i2].msgType = msgType;
                                list.result[i].htlc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_HTLC_RequestCloseCurrTx_N48:
                        list.result[i].htlc.push(htlcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_HTLC_CloseSigned_N49:
                        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
                            if ($("#request_close_htlc_hash").val() === list.result[i].htlc[i2].request_hash) {
                                list.result[i].htlc[i2].msgType = msgType;
                                list.result[i].htlc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
                        list.result[i].transfer.push(rsmcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                        for (let i2 = 0; i2 < list.result[i].transfer.length; i2++) {
                            if ($("#request_commitment_hash").val() === list.result[i].transfer[i2].msgHash) {
                                updateRsmcData(response, list.result[i].transfer[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_Core_FundingBTC_1009:
                        list.result[i].btc.push(btcData(response, msgType));
                        break;
                    case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
                        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
                            if (response.funding_txid === list.result[i].btc[i2].txid) {
                                list.result[i].btc[i2].msgType = msgType;
                                list.result[i].btc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
                        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
                            if ($("#funding_txid").val() === list.result[i].btc[i2].txid) {
                                // list.result[i].btc[i2].txid = response.txid;
                                // list.result[i].btc[i2].hex  = response.tx_hash;
                                list.result[i].btc[i2].msgType = msgType;
                                list.result[i].btc[i2].date = new Date().toLocaleString();
                            }
                        }
                        break;
                    case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
                        list.result[i].omniAsset.push(omniAssetData(response, msgType));
                        break;
                    case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
                        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
                            if ($("#funding_tx_hex").val() === list.result[i].omniAsset[i2].hex) {
                                list.result[i].temporary_channel_id = response.channel_id;
                                updateOmniAssetData(response, list.result[i].omniAsset[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
                        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
                            if ($("#channel_id").val() === list.result[i].omniAsset[i2].channel_id) {
                                updateOmniAssetData(response, list.result[i].omniAsset[i2], msgType);
                            }
                        }
                        break;
                    case enumMsgType.MsgType_CloseChannelRequest_N38:
                        if (list.result[i].data.length > 2) {
                            list.result[i].data[2].request_close_channel_hash = response.request_close_channel_hash;
                            list.result[i].data[2].date = new Date().toLocaleString();
                        } else {
                            list.result[i].data.push(channelData(response));
                        }
                        break;
                    case enumMsgType.MsgType_CloseChannelSign_N39:
                        list.result[i].data.push(channelData(response));
                        break;
                    default:
                        list.result[i].data.push(channelData(response));
                        break;
                }

                localStorage.setItem(saveTempCI, JSON.stringify(list));
                return;
            }
        }

        // A new 
        list.result.push(dataConstruct(response, chID, msgType));
        localStorage.setItem(saveTempCI, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [dataConstruct(response, chID, msgType)]
        }
        localStorage.setItem(saveTempCI, JSON.stringify(data));
    }
}

//
function updateOmniAssetData(response, data, msgType) {
    data.msgType = msgType;
    data.date = new Date().toLocaleString();
    data.channel_id = response.channel_id;

    if (msgType === enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34) {
        data.funding_omni_hex = response.funding_omni_hex;
        data.c1a_rsmc_hex = response.c1a_rsmc_hex;
        data.rsmc_temp_address_pub_key = response.rsmc_temp_address_pub_key;
    } else if (msgType === enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35) {
        data.approval = response.approval;
        data.rd_hex = response.rd_hex;
        data.rsmc_signed_hex = response.rsmc_signed_hex;
    }
}

// mnemonic words generated with signUp api save to local storage.
function saveMnemonicData(response) {

    var mnemonic = JSON.parse(localStorage.getItem(saveMnemonic));
    // console.info('localStorage KEY  = ' + addr);

    // If has data.
    if (mnemonic) {
        // console.info('HAS DATA');
        let new_data = {
            mnemonic: response,
        }
        mnemonic.result.push(new_data);
        localStorage.setItem(saveMnemonic, JSON.stringify(mnemonic));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                mnemonic: response
            }]
        }
        localStorage.setItem(saveMnemonic, JSON.stringify(data));
    }
}

// List of friends who have interacted
function saveFriendsList(name, p2pID) {

    // var name = $("#recipient_peer_id").val();
    var list = JSON.parse(localStorage.getItem(saveFriends));

    // If has data.
    if (list) {
        // console.info('HAS DATA');
        for (let i = 0; i < list.result.length; i++) {
            if (list.result[i].name === name) {
                list.result[i].p2pID = p2pID;
                localStorage.setItem(saveFriends, JSON.stringify(list));
                return;
            }
        }

        let new_data = {
            name:  name,
            p2pID: p2pID
        }
        list.result.push(new_data);
        localStorage.setItem(saveFriends, JSON.stringify(list));

    } else {
        // console.info('FIRST DATA');
        let data = {
            result: [{
                name:  name,
                p2pID: p2pID
            }]
        }
        localStorage.setItem(saveFriends, JSON.stringify(data));
    }
}

//----------------------------------------------------------------
// Functions of buttons.

// get balance of btc and omni assets of an address.
function getBalance(strAddr) {
    // console.info('strAddr = ' + strAddr);

    var result;

    // OBD API
    obdApi.getBtcBalanceByAddress(strAddr, function(e) {
        console.info('getBtcBalance - OBD Response = ' + JSON.stringify(e));
        result = JSON.stringify(e);
        result = result.replace("\"", "").replace("\"", "");
        result = parseFloat(result);
        result = 'BALANCE : ' + result + ' BTC ';
        $("#" + strAddr).text(result);
    });

    // for omni assets
    obdApi.omniGetAllBalancesForAddress(strAddr, function(e) {
        console.info('omniGetAllBalancesForAddress - OBD Response = ' + JSON.stringify(e));

        if (e != "") {
            for (let i = 0; i < e.length; i++) {
                result += ' *** ' + parseFloat(e[i].balance) + ' ' + e[i].name +
                    ' (Property ID: ' + e[i].propertyid + ')';
            }
            $("#" + strAddr).text(result);
        }
    });
}

// Generate new mnemonic words.
function autoCreateMnemonic() {
    // Generate mnemonic by local js library.
    var mnemonic = btctool.generateMnemonic(128);
    $("#mnemonic").val(mnemonic);
    saveMnemonicData(mnemonic);
}

// Generate a new pub key of an address.
function autoCreateFundingPubkey(param) {
    // Generate address by local js library.
    var result = getNewAddressWithMnemonic();
    if (result === '') return;

    switch (param) {
        case 0:
            $("#from_address").val(result.result.address);
            $("#from_address_private_key").val(result.result.wif);
            break;
        default:
            $("#funding_pubkey").val(result.result.pubkey);
            break;
    }

    saveAddrData(result);
}

// auto Calculation Miner Fee
function autoCalcMinerFee() {
    $("#miner_fee").val('0.00001');
}

//----------------------------------------------------------------
// Functions of display User Data.
function displayUserData(obj, param) {
    removeNameReqDiv();
    createApiNameDiv(obj);

    switch (obj.id) {
        case 'MnemonicWords':
            displayMnemonic();
            break;
        case 'Addresses':
            displayAddresses(param);
            break;
        case 'Friends':
            displayFriends();
            break;
        case 'ChannelCreation':
            displayChannelCreation(param);
            break;
    }
}

//
function displayMnemonic() {
    // get [name_req_div] div
    var parent = $("#name_req_div");
    var mnemonic = JSON.parse(localStorage.getItem(saveMnemonic));

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // If has data
    if (mnemonic) {
        for (let i = 0; i < mnemonic.result.length; i++) {
            createElement(newDiv, 'h4', 'NO. ' + (i + 1));
            createElement(newDiv, 'text', mnemonic.result[i].mnemonic, 'responseText');
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h3', 'NO DATA YET. YOU CAN CREATE ONE WITH [signUp].');
    }

    parent.append(newDiv);
}

//
function displayAddresses(param) {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // console.info('LOGINED userID = '+userID);

    if (param === inNewHtml) { // New page
        var status = JSON.parse(localStorage.getItem(saveGoWhere));
        if (!status.isLogined) { // Not login.
            createElement(newDiv, 'text', 'NO USER LOGINED.');
            parent.append(newDiv);
            return;
        } else {
            userID = status.userID;
        }

    } else {
        if (!isLogined) { // Not login.
            createElement(newDiv, 'text', 'NO USER LOGINED.', 'bigText');
            parent.append(newDiv);
            return;
        }
    }

    var arrData;
    var addr = JSON.parse(localStorage.getItem(saveAddr));

    // If has data
    if (addr) {
        for (let i = 0; i < addr.result.length; i++) {
            if (userID === addr.result[i].userID) {
                var bigText = 'User ID : ' + addr.result[i].userID;
                createElement(newDiv, 'text', bigText, 'bigText');
                createElement(newDiv, 'h2', 'Address List', 'responseText');

                for (let i2 = 0; i2 < addr.result[i].data.length; i2++) {
                    createElement(newDiv, 'h3', 'NO. ' + (i2 + 1), 'responseText');

                    var strAddr = addr.result[i].data[i2].address;
                    createBalanceElement(newDiv, strAddr);

                    arrData = [
                        'Address : ' + addr.result[i].data[i2].address,
                        'Index : ' + addr.result[i].data[i2].index,
                        'PubKey : ' + addr.result[i].data[i2].pubkey,
                        'WIF : ' + addr.result[i].data[i2].wif
                    ];

                    for (let i3 = 0; i3 < arrData.length; i3++) {
                        var point   = arrData[i3].indexOf(':') + 1;
                        var title   = arrData[i3].substring(0, point);
                        var content = arrData[i3].substring(point);
                        createElement(newDiv, 'text', title);
                        createElement(newDiv, 'text', content, 'responseText');
                        createElement(newDiv, 'p');
                    }
                }

                parent.append(newDiv);
                return;
            }
        }

        // The user has not create address yet.
        displayNoData(newDiv);
        parent.append(newDiv);

    } else { // NO LOCAL STORAGE DATA YET.
        displayNoData(newDiv);
        parent.append(newDiv);
    }
}

//
function createBalanceElement(parent, strAddr) {
    // create [text] element
    var title = document.createElement('text');
    title.id = strAddr;
    title.innerText = 'Balance : ';
    parent.append(title);

    // create [button] element
    var button = document.createElement('button');
    button.innerText = 'Get Balance';
    var clickFunc = "getBalance('" + strAddr + "')";
    button.setAttribute('class', 'button button_small');
    button.setAttribute('onclick', clickFunc);
    parent.append(button);

    createElement(parent, 'p');
}

// List of friends who have interacted
function displayFriends() {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    var list = JSON.parse(localStorage.getItem(saveFriends));

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    // If has data
    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            // Display list NO.
            createElement(newDiv, 'h3', 'NO. ' + (i + 1), 'responseText');
            createElement(newDiv, 'p', 'P2P_Peer_ID: ');
            createElement(newDiv, 'p', list.result[i].p2pID, 'responseText');
            createElement(newDiv, 'p', 'Peer_ID: ');
            createElement(newDiv, 'p', list.result[i].name, 'responseText');
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h3', 'NO DATA YET.');
    }

    parent.append(newDiv);
}

// List of channel creation process records.
function displayChannelCreation(param) {
    // get [name_req_div] div
    var parent = $("#name_req_div");

    var newDiv = document.createElement('div');
    newDiv.setAttribute('class', 'panelItem');

    /*
    if (param === inNewHtml) {
        var status = JSON.parse(localStorage.getItem(saveGoWhere));
        if (!status.isLogined) { // Not login.
            createElement(parent, 'text', 'NO USER LOGINED.');
            return;
        } else {
            userID = status.userID;
        }
        
    } else {
        if (!isLogined) { // Not login.
            createElement(parent, 'text', 'NO USER LOGINED.');
            return;
        }
    }
    */

    var list = JSON.parse(localStorage.getItem(saveTempCI));

    if (list) {
        for (let i = 0; i < list.result.length; i++) {
            // createElement(parent, 'h4', 'NO. ' + (i + 1) + 
            //     ' - Temp Channel ID is: ' + list.result[i].temporary_channel_id);
            createElement(newDiv, 'h2', 'NO. ' + (i + 1), 'responseText');

            // Display channel id in creation process.
            channelID(newDiv, list, i);

            // Display channel info.
            partChannelInfo(newDiv, list, i)

            // Display depositing btc record.
            btcRecord(newDiv, list, i);

            // Display depositing omni asset record.
            omniAssetRecord(newDiv, list, i);

            // Display RSMC - transfer in channel.
            rsmcRecord(newDiv, list, i);

            // Display HTLC - transfer in channel.
            htlcRecord(newDiv, list, i);
        }
    } else { // NO LOCAL STORAGE DATA YET.
        createElement(newDiv, 'h3', 'NO DATA YET.');
    }

    parent.append(newDiv);
}

// Display channel id in creation process.
function channelID(parent, list, i) {
    // var msgType;
    try {
        var msgType = list.result[i].omniAsset[0].msgType;
    } catch (error) {}

    if (msgType === enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35) {
        createElement(parent, 'text', 'DONE - Channel ID : ');
    } else {
        createElement(parent, 'text', 'TEMP - Channel ID : ');
    }

    createElement(parent, 'p', list.result[i].temporary_channel_id, 'responseText');
}

// Display channel info.
function partChannelInfo(parent, list, i) {

    var arrData;

    for (let i2 = 0; i2 < list.result[i].data.length; i2++) {
        var title = list.result[i].data[i2].channelInfo;
        var point   = title.indexOf('-');
        var title2  = title.substring(0, point);
        var content = title.substring(point + 1);
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'text', title2);
        createElement(parent, 'p', content, 'responseText');

        // Construct data will be displayed.
        if (title.substring(0, 6) === 'LAUNCH') {
            arrData = [
                'temporary_channel_id : ' + list.result[i].data[i2].temporary_channel_id,
            ];
        } else if (title.substring(0, 3) === 'N38') {
            arrData = [
                'request_close_channel_hash : ' + list.result[i].data[i2].request_close_channel_hash,
                'date : ' + list.result[i].data[i2].date,
            ];
        } else if (title.substring(0, 3) === 'N39') {
            arrData = [
                'The channel is closed.',
                'date : ' + list.result[i].data[i2].date,
            ];
        } else {
            arrData = [
                'channel_address : ' + list.result[i].data[i2].channel_address,
                'temporary_channel_id : ' + list.result[i].data[i2].temporary_channel_id,
                'create_at : ' + list.result[i].data[i2].create_at,
                'create_by : ' + list.result[i].data[i2].create_by,
                'accept_at : ' + list.result[i].data[i2].accept_at,
                'address_a : ' + list.result[i].data[i2].address_a,
                'address_b : ' + list.result[i].data[i2].address_b,
            ];
        }

        for (let i3 = 0; i3 < arrData.length; i3++) {
            var point   = arrData[i3].indexOf(':') + 1;
            var title   = arrData[i3].substring(0, point);
            var content = arrData[i3].substring(point);
            createElement(parent, 'text', title);
            createElement(parent, 'p', content, 'responseText');
        }
    }
}

// Display depositing btc record.
function btcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].btc[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'DEPOSITING - BTC Record', 'responseText');

        for (let i2 = 0; i2 < list.result[i].btc.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].btc[i2].msgType) {
                case enumMsgType.MsgType_Core_FundingBTC_1009:
                    status = 'Precharge (1009)';
                    break;
                case enumMsgType.MsgType_FundingCreate_BtcCreate_N3400:
                    status = 'Noticed (-3400)';
                    break;
                case enumMsgType.MsgType_FundingSign_BtcSign_N3500:
                    status = 'Confirmed (-3500)';
                    break;
                default:
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].btc[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            arrData = [
                'from_address : ' + list.result[i].btc[i2].from_address,
                'amount : ' + list.result[i].btc[i2].amount,
                'txid : ' + list.result[i].btc[i2].txid,
                'hex : ' + list.result[i].btc[i2].hex,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

// Display depositing omni asset record.
function omniAssetRecord(parent, list, i) {

    var arrData;

    if (list.result[i].omniAsset[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'DEPOSITING - Omni Asset Record', 'responseText');

        for (let i2 = 0; i2 < list.result[i].omniAsset.length; i2++) {
            var status;
            switch (list.result[i].omniAsset[i2].msgType) {
                case enumMsgType.MsgType_Core_Omni_FundingAsset_2001:
                    status = 'Precharge (2001)';
                    break;
                case enumMsgType.MsgType_FundingCreate_AssetFundingCreated_N34:
                    status = 'Noticed (-34)';
                    break;
                case enumMsgType.MsgType_FundingSign_AssetFundingSigned_N35:
                    status = 'Confirmed (-35)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].omniAsset[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            arrData = [
                'from_address : ' + list.result[i].omniAsset[i2].from_address,
                'amount : ' + list.result[i].omniAsset[i2].amount,
                'property_id : ' + list.result[i].omniAsset[i2].property_id,
                'hex : ' + list.result[i].omniAsset[i2].hex,

                '(-34) Response : ----------------------',
                'channel_id : ' + list.result[i].omniAsset[i2].channel_id,
                'funding_omni_hex : ' + list.result[i].omniAsset[i2].funding_omni_hex,
                'c1a_rsmc_hex : ' + list.result[i].omniAsset[i2].c1a_rsmc_hex,
                'rsmc_temp_address_pub_key : ' + list.result[i].omniAsset[i2].rsmc_temp_address_pub_key,
                
                '(-35) Response : ----------------------',
                'approval : ' + list.result[i].omniAsset[i2].approval,
                'rd_hex : ' + list.result[i].omniAsset[i2].rd_hex,
                'rsmc_signed_hex : ' + list.result[i].omniAsset[i2].rsmc_signed_hex,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

// Display RSMC - transfer in channel.
function rsmcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].transfer[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'RSMC - transfer in channel', 'responseText');

        for (let i2 = 0; i2 < list.result[i].transfer.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].transfer[i2].msgType) {
                case enumMsgType.MsgType_CommitmentTx_CommitmentTransactionCreated_N351:
                    status = 'Pre-transfer (-351)';
                    break;
                case enumMsgType.MsgType_CommitmentTxSigned_RevokeAndAcknowledgeCommitmentTransaction_N352:
                    status = 'Done transfer (-352)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].transfer[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            arrData = [
                'channelId : ' + list.result[i].transfer[i2].channelId,
                'amount : ' + list.result[i].transfer[i2].amount,
                'msgHash : ' + list.result[i].transfer[i2].msgHash,
                // 'currTempAddressPubKey : ' + list.result[i].transfer[i2].currTempAddressPubKey,
                // 'lastTempAddressPrivateKey : ' + list.result[i].transfer[i2].lastTempAddressPrivateKey,
                'rsmcHex : ' + list.result[i].transfer[i2].rsmcHex,
                'toOtherHex : ' + list.result[i].transfer[i2].toOtherHex,
            ];

            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

// Display HTLC - transfer in channel.
function htlcRecord(parent, list, i) {

    var arrData;

    if (list.result[i].htlc[0]) {
        createElement(parent, 'p', '-----------------------------------------------');
        createElement(parent, 'h3', 'HTLC - transfer in channel', 'responseText');

        for (let i2 = 0; i2 < list.result[i].htlc.length; i2++) {
            createElement(parent, 'br');
            createElement(parent, 'text', 'NO. ' + (i2 + 1));

            var status;
            switch (list.result[i].htlc[i2].msgType) {
                case enumMsgType.MsgType_HTLC_FindPathAndSendH_N42:
                    status = 'FindPathAndSendH (-42)';
                    break;
                case enumMsgType.MsgType_HTLC_SignGetH_N44:
                    status = 'H-Signed (-44)';
                    break;
                case enumMsgType.MsgType_HTLC_CreateCommitmentTx_N45:
                    status = 'CreateCTx (-45)';
                    break;
                case enumMsgType.MsgType_HTLC_SendR_N46:
                    status = 'Send R (-46)';
                    break;
                case enumMsgType.MsgType_HTLC_VerifyR_N47:
                    status = 'Verify R (-47)';
                    break;
                case enumMsgType.MsgType_HTLC_RequestCloseCurrTx_N48:
                    status = 'Request Close (-48)';
                    break;
                case enumMsgType.MsgType_HTLC_CloseSigned_N49:
                    status = 'Closed (-49)';
                    break;
            }

            createElement(parent, 'text', ' -- ' + status);
            createElement(parent, 'text', ' -- ' + list.result[i].htlc[i2].date);
            createElement(parent, 'br');
            createElement(parent, 'p', '---------------------------------------------');

            switch (list.result[i].htlc[i2].msgType) {
                case enumMsgType.MsgType_HTLC_RequestCloseCurrTx_N48:
                case enumMsgType.MsgType_HTLC_CloseSigned_N49:
                    arrData = [
                        'channel_id : ' + list.result[i].htlc[i2].channel_id,
                        'create_at : ' + list.result[i].htlc[i2].create_at,
                        'create_by : ' + list.result[i].htlc[i2].create_by,
                        'curr_state : ' + list.result[i].htlc[i2].curr_state,
                        'request_hash : ' + list.result[i].htlc[i2].request_hash,
                    ];
                    break;

                default:
                    arrData = [
                        'channelId : ' + list.result[i].htlc[i2].channelId,
                        'h : ' + list.result[i].htlc[i2].h,
                        'r : ' + list.result[i].htlc[i2].r,
                        'request_hash : ' + list.result[i].htlc[i2].request_hash,
                        'property_id : ' + list.result[i].htlc[i2].property_id,
                        'amount : ' + list.result[i].htlc[i2].amount,
                        'memo : ' + list.result[i].htlc[i2].memo,
                        'curr_state : ' + list.result[i].htlc[i2].curr_state,
                        'sender : ' + list.result[i].htlc[i2].sender,
                        'approval : ' + list.result[i].htlc[i2].approval,
                    ];
                    break;
            }


            for (let i3 = 0; i3 < arrData.length; i3++) {
                var point   = arrData[i3].indexOf(':') + 1;
                var title   = arrData[i3].substring(0, point);
                var content = arrData[i3].substring(point);
                createElement(parent, 'text', title);
                createElement(parent, 'p', content, 'responseText');
            }
        }
    }
}

// 
function displayNoData(parent) {
    // userID
    createElement(parent, 'text', userID);
    // title
    createElement(parent, 'h3', 'NO DATA YET.');
}

//----------------------------------------------------------------
// Functions of Common Util.

// create html elements
function createElement(parent, elementName, myInnerText, cssStyle) {

    var element = document.createElement(elementName);

    if (myInnerText) {
        element.innerText = myInnerText;
    }

    if (cssStyle) {
        // element.setAttribute('style', cssStyle);
        element.setAttribute('class', cssStyle);
    }

    parent.append(element);
}

//
function displayUserDataInNewHtml(goWhere) {
    saveGoWhereData(goWhere);
    window.open('userData.html', 'data', 'height=600, width=800, top=150, ' +
        'left=500, toolbar=no, menubar=no, scrollbars=no, resizable=no, ' +
        'location=no, status=no');
}

//
function saveGoWhereData(goWhere) {
    let data = {
        goWhere: goWhere,
        isLogined: isLogined,
        userID: userID
    }
    localStorage.setItem(saveGoWhere, JSON.stringify(data));
}

// Bitcoin Testnet Faucet
function openTestnetFaucet() {
    window.open('https://testnet-faucet.mempool.co/');
}