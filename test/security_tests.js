var expect = require('chai').expect;

var security = require('../utils/security/securityhelper');

/**
 * Tests the symmetric and asymmetric encryption/decryption algorithms
 */
describe('Encryption/Decryption', function () {
    var data = "Data string to symmetrically encrypt";
    console.log("Data[" + data + "]");
    describe('#symmetric', function () {
        var password = security.createRandomSymmetricKeyString();
        it('should encrypt a data item using a symmetric key and the decrypted data item should be the same as the input data item', function (done) {
            var encryptedSym = security.symmetricEncrypt(data, password);
            var decryptedSym = security.symmetricDecrypt(encryptedSym, password);
            expect(data).to.equal(decryptedSym);
            console.log("\nEncryptedSym[" + encryptedSym + "]\nDecryptedSym[" + decryptedSym + "]");
            done();
        });
    });

    describe('#asymmetric', function () {
        this.timeout(10000); //may take time to create the PKI

        it('should encrypt a data item using an asymmetric RSA key pair, and then decrypt it again, such that the decrypted data is the same as the input', function (done) {
            var x = security.createKeyPair();
            var encryptedAsym = security.encryptStringWithRsaPublicKey(data, x.publicKey);
            var decryptedAsym = security.decryptStringWithRsaPrivateKey(encryptedAsym, x.privateKey);
            expect(data).to.equal(decryptedAsym);
            console.log("\nEncryptedAsym[" + encryptedAsym + "]\nDecryptedAsym[" + decryptedAsym + "]");
            done();
        });
    });
});