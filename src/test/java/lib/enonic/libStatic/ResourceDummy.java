package lib.enonic.libStatic;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.google.common.io.ByteSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.io.Reader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Test usage only
 */
public class ResourceDummy implements Resource {

    private final static Logger LOG = LoggerFactory.getLogger( ResourceDummy.class );

    private final ResourceKey key;
    private final boolean exists;
    private final String content;

    public ResourceDummy(final ResourceKey key, boolean exists, String content) {
        this.key = key;
        this.exists = exists;
        this.content = content;
    }

    private String getContent(String label) {
        return content + " (" + label + ")";
    }

    //// Implemented

    @Override
    public ResourceKey getKey() {
        return key;
    }

    @Override
    public boolean exists() {
        return exists;
    }


    @Override
    public long getSize() {
        return content.length();
    }

    @Override
    public long getTimestamp() {
        return 1337 + getSize();
    }

    @Override
    public String readString() {
        return getContent("readString");
    }

    @Override
    public byte[] readBytes() {
        return (getContent("readBytes")).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public List<String> readLines() {
        return Arrays.asList(getContent("readLines").split(" "));
    }

    @Override
    public ByteSource getBytes() {
        return ByteSource.wrap(content.getBytes(StandardCharsets.UTF_8));
    }

    //// No-ops

    @Override
    public URL getUrl() {
        return null;
    }

    @Override public void requireExists() {
    }

    @Override
    public InputStream openStream() {
        return null;
    }

    @Override
    public Reader openReader() {
        return null;
    }
}
