package lib.enonic.libStatic;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.HashMap;


public class CachedEtagger {
    private final static Logger LOG = LoggerFactory.getLogger( CachedEtagger.class );

    private final boolean isDev;
    protected HashMap<String, String> etagCache = new HashMap<>();

    public CachedEtagger(boolean isDev) {
        this.isDev = isDev;
    }

    protected String cacheAndGetEtag(String path, byte[] contentBytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(contentBytes);
            byte[] digested = md.digest();
            String etag = new BigInteger(1, digested).toString(64).toLowerCase();

            etagCache.put(path, etag);

            return etag;

        } catch (Exception e) {
            LOG.error("Couldn't generate ETag from resource '" + path + "'", e);
            if (isDev) {
                e.printStackTrace();
            }
            return null;
        }
    }

    protected String getEtag(String path, byte[] contentBytes, boolean forceReCache) {
        synchronized (etagCache) {
            if (forceReCache || !etagCache.containsKey(path)) {
                return cacheAndGetEtag(path, contentBytes);
            }
            return etagCache.get(path);
        }
    }
}
