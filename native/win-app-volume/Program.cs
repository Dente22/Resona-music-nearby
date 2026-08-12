using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

/// <summary>
/// Sets per-app volume in the Windows Volume Mixer (WASAPI ISimpleAudioVolume).
/// Usage:
///   win-app-volume.exe set &lt;0-100&gt; [pid ...]
///   win-app-volume.exe set-name &lt;0-100&gt; &lt;processName&gt; [processName ...]
/// Compatible with .NET Framework 4.x / C# 5.
/// </summary>
internal static class Program
{
    private static int Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.Error.WriteLine("usage: win-app-volume set <0-100> [pid ...] | set-name <0-100> <name>...");
            return 2;
        }

        string cmd = args[0].ToLowerInvariant();
        float percent;
        if (!float.TryParse(args[1], out percent))
        {
            Console.Error.WriteLine("invalid percent");
            return 2;
        }

        percent = Math.Max(0f, Math.Min(100f, percent));
        float scalar = percent / 100f;
        bool mute = percent <= 0.001f;
        int touched = 0;

        try
        {
            if (cmd == "set")
            {
                HashSet<int> pids = new HashSet<int>();
                for (int i = 2; i < args.Length; i++)
                {
                    int pid;
                    if (int.TryParse(args[i], out pid) && pid > 0)
                        pids.Add(pid);
                }
                if (pids.Count == 0)
                    pids.Add(Process.GetCurrentProcess().Id);

                touched = VolumeMixer.ApplyToPids(pids, scalar, mute);
            }
            else if (cmd == "set-name")
            {
                HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                for (int i = 2; i < args.Length; i++)
                {
                    string n = args[i];
                    if (string.IsNullOrWhiteSpace(n)) continue;
                    if (n.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                        n = n.Substring(0, n.Length - 4);
                    names.Add(n);
                }
                if (names.Count == 0)
                {
                    Console.Error.WriteLine("missing process names");
                    return 2;
                }
                touched = VolumeMixer.ApplyToProcessNames(names, scalar, mute);
            }
            else
            {
                Console.Error.WriteLine("unknown command");
                return 2;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }

        Console.WriteLine("ok touched=" + touched + " percent=" + percent.ToString("0.##"));
        return 0;
    }
}

internal static class VolumeMixer
{
    public static int ApplyToProcessNames(HashSet<string> names, float scalar, bool mute)
    {
        HashSet<int> pids = new HashSet<int>();
        Process[] processes = Process.GetProcesses();
        for (int i = 0; i < processes.Length; i++)
        {
            Process proc = processes[i];
            try
            {
                if (names.Contains(proc.ProcessName))
                    pids.Add(proc.Id);
            }
            catch
            {
            }
            finally
            {
                try { proc.Dispose(); } catch { }
            }
        }
        return ApplyToPids(pids, scalar, mute);
    }

    public static int ApplyToPids(HashSet<int> pids, float scalar, bool mute)
    {
        if (pids == null || pids.Count == 0) return 0;

        IMMDeviceEnumerator deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
        IMMDevice speakers;
        deviceEnumerator.GetDefaultAudioEndpoint(EDataFlow.eRender, ERole.eMultimedia, out speakers);

        Guid iid = typeof(IAudioSessionManager2).GUID;
        object o;
        speakers.Activate(ref iid, 0, IntPtr.Zero, out o);
        IAudioSessionManager2 mgr = (IAudioSessionManager2)o;

        IAudioSessionEnumerator sessionEnumerator;
        mgr.GetSessionEnumerator(out sessionEnumerator);
        int count;
        sessionEnumerator.GetCount(out count);

        int touched = 0;
        Guid ctx = Guid.Empty;

        for (int i = 0; i < count; i++)
        {
            IAudioSessionControl2 ctl = null;
            try
            {
                sessionEnumerator.GetSession(i, out ctl);
                int cpid;
                ctl.GetProcessId(out cpid);
                if (!pids.Contains(cpid)) continue;

                ISimpleAudioVolume volume = ctl as ISimpleAudioVolume;
                if (volume == null) continue;

                volume.SetMasterVolume(scalar, ref ctx);
                volume.SetMute(mute, ref ctx);
                touched++;
            }
            catch
            {
            }
            finally
            {
                if (ctl != null) Marshal.ReleaseComObject(ctl);
            }
        }

        Marshal.ReleaseComObject(sessionEnumerator);
        Marshal.ReleaseComObject(mgr);
        Marshal.ReleaseComObject(speakers);
        Marshal.ReleaseComObject(deviceEnumerator);
        return touched;
    }
}

[ComImport]
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
internal class MMDeviceEnumerator
{
}

internal enum EDataFlow
{
    eRender,
    eCapture,
    eAll,
}

internal enum ERole
{
    eConsole,
    eMultimedia,
    eCommunications,
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceEnumerator
{
    int NotImpl1();

    [PreserveSig]
    int GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice ppDevice);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDevice
{
    [PreserveSig]
    int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioSessionManager2
{
    int NotImpl1();
    int NotImpl2();

    [PreserveSig]
    int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
}

[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioSessionEnumerator
{
    [PreserveSig]
    int GetCount(out int SessionCount);

    [PreserveSig]
    int GetSession(int SessionCount, out IAudioSessionControl2 Session);
}

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface ISimpleAudioVolume
{
    [PreserveSig]
    int SetMasterVolume(float fLevel, ref Guid EventContext);

    [PreserveSig]
    int GetMasterVolume(out float pfLevel);

    [PreserveSig]
    int SetMute(bool bMute, ref Guid EventContext);

    [PreserveSig]
    int GetMute(out bool pbMute);
}

[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioSessionControl2
{
    [PreserveSig] int NotImpl0();
    [PreserveSig] int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string Value, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int GetGroupingParam(out Guid pRetVal);
    [PreserveSig] int SetGroupingParam([MarshalAs(UnmanagedType.LPStruct)] Guid Override, [MarshalAs(UnmanagedType.LPStruct)] Guid EventContext);
    [PreserveSig] int NotImpl1();
    [PreserveSig] int NotImpl2();
    [PreserveSig] int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string pRetVal);
    [PreserveSig] int GetProcessId(out int pRetVal);
    [PreserveSig] int IsSystemSoundsSession();
    [PreserveSig] int SetDuckingPreference(bool optOut);
}
