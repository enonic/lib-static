package lib.enonic.libStatic;

import com.enonic.xp.server.RunMode;

public class AppHelper
{
    public boolean isDevMode()
    {
        return RunMode.get() == RunMode.DEV;
    }
}
