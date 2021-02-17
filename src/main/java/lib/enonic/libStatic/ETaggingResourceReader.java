package lib.enonic.libStatic;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.server.RunMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.util.HashMap;

public class ETaggingResourceReader implements ScriptBean {
    private final static Logger LOG = LoggerFactory.getLogger( ETaggingResourceReader.class );

    private final boolean isProd = RunMode.get() == RunMode.PROD;

    private static final HashMap<String, Long> lastModifiedCache = new HashMap<>();
    private static final HashMap<String, String> etagCache = new HashMap<>();

    private static ResourceService resourceService;

    private String getEtag(String path, byte[] contentBytes, boolean reCache) {
        synchronized (etagCache) {
            try {
                if (reCache || !etagCache.containsKey(path)) {
                    MessageDigest md = MessageDigest.getInstance("MD5");
                    md.update(contentBytes);
                    byte[] digested = md.digest();
                    String etag = new BigInteger(1, digested).toString(36).toLowerCase();

                    etagCache.put(path, etag);

                    return etag;
                }

                return etagCache.get(path);

            } catch (Exception e) {
                LOG.error("Couldn't generate ETag from resource '" + path + "'", e);
                if (!isProd) {
                    e.printStackTrace();
                }
                return null;
            }
        }
    }

    /** Gets a content string and MD5-contenthash etag string.
     *
     *
     * @param path (string) Absolute (i.e. JAR-root-relative) path, name and extension to the file
     * @param etagOverride (boolean) if null, default mode which depends on XP run mode: true in prod mode, false in dev mode.
     *                     Setting to true or false overrides this.
     *                     * If true: processes and caches etags.
     *                       - In prod mode: cache the etag by file path only.
     *                       - In dev mode, check file's last-modified date. If newer than cached version, re-hash the etag and replace it in the cache.
     *                     * If false: skips all etag processing and returns no etag string.
     * @return (String array) [statusCode, contentOrErrorMessage, etag]
     */
    public String[] read(String path, Boolean etagOverride) {
        LOG.info("path: " + path);
        LOG.info("etagOverride: " + etagOverride);

        Resource resource;
        byte[] contentBytes;

        LOG.info("A");

        synchronized (resourceService) {
            try {
                resource = resourceService.getResource(ResourceKey.from(path));
                if (!resource.exists()) {
                    // TODO: Fallback to index etc?
                    return new String[]{"404", "Resource not found: '" + path + "'"};
                }
                contentBytes = resource.getBytes().read();

            } catch (IOException e) {
                LOG.error("Couldn't read resource: '" + path + "'", e);
                if (!isProd) {
                    e.printStackTrace();
                }
                return new String[]{"500", "Couldn't read resource: '" + path + "'"};
            }
        }

        LOG.info("B");

        boolean reCache = false;
        if (isProd) {
            reCache = (etagOverride != false); // etagOverride: null value should be ignored, i.e: recache should be true.

        } else if (etagOverride) {
            Long lastModified = null;
            try {
                lastModified = resource.getTimestamp();

            } catch (Exception e) {
                LOG.error("Couldn't read resource last-modified timestamp: '" + path + "'");
                reCache = true;
            }

            if (!reCache && (!lastModifiedCache.containsKey(path) || lastModifiedCache.get(path) != lastModified)) {
                reCache = true;
                lastModifiedCache.put(path, lastModified);
            }
        }

        LOG.info("C");

        String etag = getEtag(path, contentBytes, reCache);


        LOG.info("D");

        String content = null;
        try {
            content = resource.readString();
        } catch (Exception e) {
            LOG.error("Couldn't read resource to string: '" + path + "'", e);
            if (!isProd) {
                e.printStackTrace();
            }
            return new String[]{"500", "Couldn't read resource: '" + path + "'"};
        }

        LOG.info("E");

        return new String[]{"200", content, etag};
    }

    @Override
    public void initialize(BeanContext context) {
        this.resourceService = context.getService( ResourceService.class ).get();
    }
}
