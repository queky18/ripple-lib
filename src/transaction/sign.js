/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const keypairs = require('ripple-keypairs')
const binary = require('ripple-binary-codec')
const {computeBinaryTransactionHash} = require('ripple-hashes')
const validate = utils.common.validate

function computeSignature(tx: Object, privateKey: string, signAs: ?string) {
  const signingData = signAs ?
    binary.encodeForMultisigning(tx, signAs) : binary.encodeForSigning(tx)
  return keypairs.sign(signingData, privateKey)
}

function sign(txJSON: string, keypair, options?: Object = {}
): {signedTransaction: string; id: string} {
  if(typeof(keypair) === 'string') {
      validate.sign({txJSON, keypair})
      // we can't validate that the secret matches the account because
      // the secret could correspond to the regular key
      keypair = keypairs.deriveKeypair(keypair)
  }
  const tx = JSON.parse(txJSON)
  if (tx.TxnSignature || tx.Signers) {
    throw new utils.common.errors.ValidationError(
      'txJSON must not contain "TxnSignature" or "Signers" properties')
  }
  tx.SigningPubKey = options.signAs ? '' : keypair.publicKey
  if (options.signAs) {
    const signer = {
      Account: options.signAs,
      SigningPubKey: keypair.publicKey,
      TxnSignature: computeSignature(tx, keypair.privateKey, options.signAs)
    }
    tx.Signers = [{Signer: signer}]
  } else {
    tx.TxnSignature = computeSignature(tx, keypair.privateKey)
  }

  const serialized = binary.encode(tx)
  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  }
}

module.exports = sign
