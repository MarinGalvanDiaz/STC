package com.escom.backend;

import org.bouncycastle.asn1.x9.ECNamedCurveTable;
import org.bouncycastle.asn1.x9.X9ECParameters;
import org.bouncycastle.crypto.params.ECDomainParameters;
import org.bouncycastle.crypto.params.ECPrivateKeyParameters;
import org.bouncycastle.crypto.params.ECPublicKeyParameters;
import org.bouncycastle.crypto.generators.ECKeyPairGenerator;
import org.bouncycastle.crypto.params.ECKeyGenerationParameters;
import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.math.ec.ECPoint;
import org.bouncycastle.util.encoders.Hex;
import org.junit.jupiter.api.Test;

import java.security.MessageDigest;
import java.security.SecureRandom;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ECDHTest {
    @Test
    public void test3PartyCircularECDH() throws Exception {
        // Curve NIST P-256 (secp256r1)
        X9ECParameters ecParams = ECNamedCurveTable.getByName("secp256r1");
        ECDomainParameters domainParams = new ECDomainParameters(
                ecParams.getCurve(), ecParams.getG(), ecParams.getN(), ecParams.getH()
        );

        ECKeyPairGenerator gen = new ECKeyPairGenerator();
        SecureRandom random = new SecureRandom();
        gen.init(new ECKeyGenerationParameters(domainParams, random));

        // 1. Key Generation
        // Alice
        AsymmetricCipherKeyPair kpAlice = gen.generateKeyPair();
        ECPrivateKeyParameters privAlice = (ECPrivateKeyParameters) kpAlice.getPrivate();
        ECPublicKeyParameters pubAlice = (ECPublicKeyParameters) kpAlice.getPublic();

        // Bob
        AsymmetricCipherKeyPair kpBob = gen.generateKeyPair();
        ECPrivateKeyParameters privBob = (ECPrivateKeyParameters) kpBob.getPrivate();
        ECPublicKeyParameters pubBob = (ECPublicKeyParameters) kpBob.getPublic();

        // Candy
        AsymmetricCipherKeyPair kpCandy = gen.generateKeyPair();
        ECPrivateKeyParameters privCandy = (ECPrivateKeyParameters) kpCandy.getPrivate();
        ECPublicKeyParameters pubCandy = (ECPublicKeyParameters) kpCandy.getPublic();

        // Round 1 Exchange:
        // Alice sends A to Bob
        // Bob sends B to Candy
        // Candy sends C to Alice

        // Round 2 Intermediate Key computation:
        // Alice receives C -> computes Z_AC = a * C = a * c * G
        ECPoint zAC = pubCandy.getQ().multiply(privAlice.getD()).normalize();

        // Bob receives A -> computes Z_BA = b * A = b * a * G
        ECPoint zBA = pubAlice.getQ().multiply(privBob.getD()).normalize();

        // Candy receives B -> computes Z_CB = c * B = c * b * G
        ECPoint zCB = pubBob.getQ().multiply(privCandy.getD()).normalize();

        // Round 2 Exchange:
        // Alice sends Z_AC to Bob
        // Bob sends Z_BA to Candy
        // Candy sends Z_CB to Alice

        // Round 3 Final Key computation:
        // Alice receives Z_CB -> computes a * Z_CB = a * (b * c * G) = abcG
        ECPoint finalAlice = zCB.multiply(privAlice.getD()).normalize();

        // Bob receives Z_AC -> computes b * Z_AC = b * (a * c * G) = abcG
        ECPoint finalBob = zAC.multiply(privBob.getD()).normalize();

        // Candy receives Z_BA -> computes c * Z_BA = c * (a * b * G) = abcG
        ECPoint finalCandy = zBA.multiply(privCandy.getD()).normalize();

        // Verify Points are identical
        assertEquals(finalAlice, finalBob);
        assertEquals(finalBob, finalCandy);

        // KDF: SHA-256 over affine x-coordinate (NIST SP 800-56A)
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        byte[] keyAlice = sha256.digest(finalAlice.getAffineXCoord().getEncoded());
        sha256.reset();
        byte[] keyBob = sha256.digest(finalBob.getAffineXCoord().getEncoded());
        sha256.reset();
        byte[] keyCandy = sha256.digest(finalCandy.getAffineXCoord().getEncoded());

        String hexAlice = Hex.toHexString(keyAlice);
        String hexBob = Hex.toHexString(keyBob);
        String hexCandy = Hex.toHexString(keyCandy);

        System.out.println("Alice Final Key: " + hexAlice);
        System.out.println("Bob   Final Key: " + hexBob);
        System.out.println("Candy Final Key: " + hexCandy);

        assertEquals(hexAlice, hexBob);
        assertEquals(hexBob, hexCandy);
    }
}
