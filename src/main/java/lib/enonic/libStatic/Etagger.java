package lib.enonic.libStatic;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;


public class Etagger {
    public String getEtag(byte[] contentBytes) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        md.update(contentBytes);
        byte[] digested = md.digest();
        return new BigInteger(1, digested).toString(36).toLowerCase();
    }
}
