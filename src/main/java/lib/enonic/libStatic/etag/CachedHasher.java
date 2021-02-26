package lib.enonic.libStatic.etag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.resource.Resource;

import java.util.HashMap;


public class CachedHasher {
    private final static Logger LOG = LoggerFactory.getLogger( CachedHasher.class );

    private final boolean isDev;
    protected HashMap<String, String> cache = new HashMap<>();
    protected Hasher hasher = new Hasher();

    public CachedHasher(boolean isDev) {
        this.isDev = isDev;
    }

    protected String getCachedHash(String path, Resource resource, boolean forceReCache) {
        synchronized (cache) {
            try {
                if (forceReCache || !cache.containsKey(path)) {
                    // Long t0 = System.nanoTime();
                    byte[] contentBytes = resource.getBytes().read();
                    // Long t1 = System.nanoTime();
                    // LOG.info("Read bytes in:  "+ ((t1-t0)/1000000000F));

                    String etag = hasher.getHash(contentBytes);
                    cache.put(path, etag);
                    return etag;
                }
                return cache.get(path);

            } catch (Exception e) {
                LOG.error("Couldn't generate ETag from resource '" + path + "'", e);
                cache.remove(path);

                if (isDev) {
                    e.printStackTrace();
                }
                return null;
            }
        }
    }
}
