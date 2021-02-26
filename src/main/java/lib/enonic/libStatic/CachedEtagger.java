package lib.enonic.libStatic;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.resource.Resource;

import java.util.HashMap;


public class CachedEtagger {
    private final static Logger LOG = LoggerFactory.getLogger( CachedEtagger.class );

    private final boolean isDev;
    protected HashMap<String, String> etagCache = new HashMap<>();
    protected Etagger etagger = new Etagger();

    public CachedEtagger(boolean isDev) {
        this.isDev = isDev;
    }

    protected String getCachedEtag(String path, Resource resource, boolean forceReCache) {
        synchronized (etagCache) {
            try {
                if (forceReCache || !etagCache.containsKey(path)) {

                    Long t0 = System.nanoTime();
                    byte[] contentBytes = resource.getBytes().read();
                    Long t1 = System.nanoTime();
                    LOG.info("Read bytes in nanos:  "+ ((t1-t0)/1000000000F));

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
