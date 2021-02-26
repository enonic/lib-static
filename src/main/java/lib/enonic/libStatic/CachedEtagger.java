package lib.enonic.libStatic;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;


public class CachedEtagger {
    private final static Logger LOG = LoggerFactory.getLogger( CachedEtagger.class );

    private final boolean isDev;
    protected HashMap<String, String> etagCache = new HashMap<>();
    protected Etagger etagger = new Etagger();

    public CachedEtagger(boolean isDev) {
        this.isDev = isDev;
    }

    protected String getCachedEtag(String path, byte[] contentBytes, boolean forceReCache) {
        synchronized (etagCache) {
            try {
                if (forceReCache || !etagCache.containsKey(path)) {
                    String etag = etagger.getEtag(contentBytes);
                    etagCache.put(path, etag);
                    return etag;
                }
                return etagCache.get(path);

            } catch (Exception e) {
                LOG.error("Couldn't generate ETag from resource '" + path + "'", e);
                etagCache.remove(path);

                if (isDev) {
                    e.printStackTrace();
                }
                return null;
            }
        }
    }
}
