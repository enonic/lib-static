package lib.enonic.libStatic;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.util.MediaTypes;
import com.google.common.io.ByteSource;
import com.google.common.net.MediaType;
import org.apache.commons.io.Charsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public class IoMock
    implements ScriptBean
{
    private final static Logger LOG = LoggerFactory.getLogger( IoMock.class );

    public String getMimeType( final String key )
    {
        if ( key == null )
        {
            return MediaType.OCTET_STREAM.toString();
        }

        String[] pathAndExt = key.split("\\.");

        return MediaTypes.instance().fromExt(pathAndExt[pathAndExt.length-1]).toString();
    }

    public Resource getResource( final Object key, final boolean exists, final String content )
    {
        return new ResourceDummy(
                toResourceKey(key),
                exists,
                (content != null)
                        ? content
                        : "ResourceDummy content from '" + key + "'"
        );
    }

    public String readText(ByteSource byteSource) throws IOException {
        return byteSource.asCharSource(Charsets.UTF_8).read();
    }

    private ResourceKey toResourceKey( final Object value )
    {
        if ( value == null )
        {
            return null;
        }

        if ( value instanceof ResourceKey )
        {
            return (ResourceKey) value;
        }

        if ( value instanceof String ) {
            return ResourceKey.from((String)value);
        }

        throw new RuntimeException("Can only mock Resources with valid string keys");
    }

    @Override
    public void initialize( BeanContext context ) { }

}
