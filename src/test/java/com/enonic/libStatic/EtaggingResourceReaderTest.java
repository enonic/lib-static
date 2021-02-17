package com.enonic.libStatic;

import com.enonic.xp.testing.ScriptRunnerSupport;

public class EtaggingResourceReaderTest
        extends ScriptRunnerSupport
{
    @Override
    public String getScriptTestFile()
    {
        return "/lib/enonic/etaggingResourceReader-test.js";
    }
}
