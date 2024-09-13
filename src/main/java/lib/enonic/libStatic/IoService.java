package lib.enonic.libStatic;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.Supplier;

import org.osgi.framework.Bundle;
import org.osgi.framework.FrameworkUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.io.ByteSource;
import com.google.common.net.MediaType;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceBase;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.util.MediaTypes;

public class IoService
    implements ScriptBean
{
    private static final Logger LOG = LoggerFactory.getLogger( IoService.class );

    private Supplier<ResourceService> resourceServiceSupplier;

    private ResourceKey parentResourceKey;

    private Bundle bundle;

    public String getMimeType( final Object key )
    {
        if ( key == null )
        {
            return MediaType.OCTET_STREAM.toString();
        }

        return MediaTypes.instance().fromFile( key.toString() ).toString();
    }

    public Resource getResource( final Object key )
    {
        final ResourceKey resourceKey = toResourceKey( key );
        final ResourceService service = this.resourceServiceSupplier.get();
        return new ResourceWrapper( service.getResource( resourceKey ) );
    }

    public String readText( ByteSource byteSource )
        throws IOException
    {
        return byteSource.asCharSource( StandardCharsets.UTF_8 ).read();
    }

    public boolean isDirectory( final String pathToResource )
    {
      final URL url = this.bundle.getResource( pathToResource );
      return url != null && url.getPath().endsWith( "/" );
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

        return parentResourceKey.resolve( value.toString() );
    }

    @Override
    public void initialize( BeanContext context )
    {
        this.resourceServiceSupplier = context.getService( ResourceService.class );
        this.parentResourceKey = context.getResourceKey();
        this.bundle = FrameworkUtil.getBundle( this.getClass() );
    }

    private static class ResourceWrapper
        extends ResourceBase
    {
        Resource resource;

        public ResourceWrapper( final Resource resource )
        {
            super( resource.getKey() );
            this.resource = resource;
        }

        @Override
        public URL getUrl()
        {
            return resource.getUrl();
        }

        @Override
        public boolean exists()
        {
            final boolean exists = resource.exists();
            if ( !exists )
            {
                return false;
            }

            final URL url = resource.getUrl();
            if ( url == null )
            {
                return false;
            }
            if ( url.getFile().endsWith( "/" ) )
            {
                return false;
            }
            if ( "file".equalsIgnoreCase( url.getProtocol() ) )
            {
                try
                {
                    if ( Files.isDirectory( Path.of( url.toURI() ) ) )
                    {
                        return false;
                    }
                }
                catch ( URISyntaxException e )
                {
                    return false;
                }
            }

            // Due to https://issues.apache.org/jira/browse/FELIX-6294 there is no easy way to identify directories.
            // Simplest solution is to check if file is empty because directories in zip are empty.
            // Filesystem directories may have non-empty data, but we handled them earlier.
            // We sacrifice empty files, but for lib-static serving empty files is not a primary task, anyway.
            try (InputStream stream = url.openStream())
            {
                if ( stream.read() == -1 )
                {
                    return false;
                }
            }
            catch ( IOException e )
            {
                return false;
            }

            return true;
        }

        public boolean isDirectory()
        {
            return false;
        }

        @Override
        public long getSize()
        {
            if ( !exists() )
            {
                return -1;
            }
            return resource.getSize();
        }

        @Override
        public long getTimestamp()
        {
            if ( !exists() )
            {
                return -1;
            }
            return resource.getTimestamp();
        }

        @Override
        public ByteSource getBytes()
        {
            requireExists();
            return resource.getBytes();
        }

        @Override
        public String getResolverName()
        {
          return "resourceWrapper";
        }
    }
}
