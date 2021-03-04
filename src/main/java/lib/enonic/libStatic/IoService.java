package lib.enonic.libStatic;

import java.util.function.Supplier;

import com.google.common.net.MediaType;

import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.util.MediaTypes;

public class IoService
    implements ScriptBean
{
    private Supplier<ResourceService> resourceServiceSupplier;

    private ResourceKey parentResourceKey;

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
        return service.getResource( resourceKey );
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
    }
}
