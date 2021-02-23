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
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

public class ETaggingResourceReader implements ScriptBean {
    private final static Logger LOG = LoggerFactory.getLogger( ETaggingResourceReader.class );

    protected boolean isDev = RunMode.get() != RunMode.PROD;

    private final HashMap<String, Long> lastModifiedCache = new HashMap<>();
    private final HashMap<String, String> etagCache = new HashMap<>();

    private ResourceService resourceService;

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
                if (isDev) {
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
     * @param etagOverrideMode (int) if 0, default handling: in XP prod mode do cached processing without lastModified-checking, and in dev mode skip all etag processing
     *                     Setting to -1 or 1 overrides this:
     *                     * If 1: process and cache etags, even in dev mode.
     *                       - In prod mode: cache the etag by file path only.
     *                       - In dev mode, check file's last-modified date. If newer than cached version, re-hash the etag and replace it in the cache.
     *                     * If -1: skips all etag processing and returns no etag string, even in prod.
     * @return (String array) [statusCode, contentOrErrorMessage, etag]
     */
    public List<String> read(String path, Integer etagOverrideMode) {
        if (path.endsWith(":")) {
            return Arrays.asList("500", "Empty path not allowed.");
        }
        if (etagOverrideMode < -1 || etagOverrideMode > 1) {
            return Arrays.asList("500", "Expected etag override mode between -1 and 1. Found: " + etagOverrideMode);
        }

        Resource resource;
        byte[] contentBytes;

        synchronized (resourceService) {
            try {
                resource = resourceService.getResource(ResourceKey.from(path));
                if (!resource.exists()) {
                    // TODO: Fallback to index etc?
                    return Arrays.asList("404", "Resource not found: '" + path + "'");
                }
                contentBytes = resource.getBytes().read();

            } catch (IOException e) {
                LOG.error("Couldn't read resource: '" + path + "'", e);
                if (isDev) {
                    e.printStackTrace();
                }
                return Arrays.asList("500", "Couldn't read resource: '" + path + "'");
            }
        }

        boolean reCache = false;


        if (!isDev) {
            reCache = (etagOverrideMode > -1);

        } else if (etagOverrideMode == 1) {
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

        boolean processEtag = etagOverrideMode > (isDev ? 0 : -1); // 0: true in prod, false in dev. 1 forces true in dev, -1 forces false in prod.
        System.out.println("\tprocessEtag: " + processEtag);
        System.out.println("\trecache:   " + reCache+"\n");

        try {
            String content = resource.readString();

            if (processEtag) {
                String etag = getEtag(path, contentBytes, reCache);
                return Arrays.asList("200", content, etag);
            } else {
                return Arrays.asList("200", content);
            }

        } catch (Exception e) {
            LOG.error("Couldn't read resource to string: '" + path + "'", e);
            if (isDev) {
                e.printStackTrace();
            }
            return Arrays.asList("500", "Couldn't read resource: '" + path + "'");
        }
    }

    @Override
    public void initialize(BeanContext context) {
        this.resourceService = context.getService( ResourceService.class ).get();
    }
}
