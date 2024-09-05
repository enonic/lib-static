package lib.enonic.libStatic;

import java.util.Objects;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.context.ContextAccessor;
// import com.enonic.xp.core.impl.app.ApplicationFactoryService;
// import com.enonic.xp.core.impl.app.resolver.ApplicationUrlResolver;
// import com.enonic.xp.core.internal.HexCoder;
import lib.enonic.libStatic.HexCoder;
import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
// import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.server.RunMode;

public class AppHelper
{
  protected ResourceService resourceService;

  // private final ApplicationFactoryService applicationFactoryService;

  public boolean isDevMode()
  {
    return RunMode.get() == RunMode.DEV;
  }

  public String getFingerprint(String application) {
    final ApplicationKey applicationKey = ApplicationKey.from( application );
    // new ApplicationResolver().portalRequest( this.portalRequest ).application( this.params.getApplication() ).resolve();

    final Resource resource = this.resourceService.getResource( ResourceKey.from( applicationKey, "META-INF/MANIFEST.MF" ) );
    // final Resource resource = getResource( ResourceKey.from( applicationKey, "META-INF/MANIFEST.MF" ) );
    if ( !resource.exists() )
    {
      throw new IllegalArgumentException( "Could not find application [" + applicationKey + "]" );
    }
    return isDevMode() ? String.valueOf(stableTime()) : HexCoder.toHex(resource.getTimestamp());
  }

  private static long stableTime()
  {
    final Long localScopeTime = (Long) ContextAccessor.current().getLocalScope().getAttribute( "__currentTimeMillis" );
    return Objects.requireNonNullElseGet( localScopeTime, System::currentTimeMillis );
  }

  // private Resource getResource( final ResourceKey key )
  // {
  //   return findApplicationUrlResolver( key.getApplicationKey() ).map( urlResolver -> urlResolver.findResource( key.getPath() ) )
  //     .orElse( new UrlResource( key, null ) );
  // }

  // private Optional<ApplicationUrlResolver> findApplicationUrlResolver( final ApplicationKey key )
  // {
  //   final String resolverSource = (String) ContextAccessor.current().getAttribute( ResourceConstants.RESOURCE_SOURCE_ATTRIBUTE );
  //   return applicationFactoryService.findResolver( isSystemApp( key ) ? SYSTEM_APPLICATION_KEY : key, resolverSource );
  // }
}
