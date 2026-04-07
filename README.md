# luci-app-proxy-arp

LuCI application for managing Proxy ARP entries on OpenWRT.

Proxy ARP makes a router answer ARP requests on behalf of another device. When a device on the local network asks "who has IP X?", the router replies with its own MAC address, causing traffic for IP X to be sent to the router. The router then forwards it — typically through a VPN tunnel — to the actual device.

## When do you need this?

**Remote device on local LAN.** A device is physically at a remote site, connected via VPN. You want local devices to reach it without changing their network configuration — they just ARP for its IP and the router handles the rest.

```
Local LAN                              Remote site
[Device A] ---- [Router] ===== VPN ===== [Device B]
192.168.1.10    proxy for .20            192.168.1.20

Device A sends: "who has 192.168.1.20?"
Router replies: "I do" (Proxy ARP)
Device A sends traffic to Router, Router forwards through VPN to Device B
```

**Overlapping subnets with VPN.** Two sites share the same subnet. Combined with prefix NAT (1:1 subnet translation), Proxy ARP lets devices on each side find each other transparently.

**Public IP forwarding.** A public IP needs to be reachable at a remote site via a VPN tunnel. The local router proxies the IP on its WAN interface so the upstream router sends traffic to it.

## How it works

1. You define Proxy ARP entries via LuCI (**Network → Proxy ARP**) or UCI (`/etc/config/proxy-arp`)
2. Each entry specifies an IP to proxy and the interface to answer ARP on
3. **Always** mode: proxy entry is active at boot, permanently
4. **When host is reachable** mode: a watchdog pings a probe IP periodically; the proxy entry is only active while the probe responds
5. Optionally, a /32 host route can be managed alongside the proxy entry

## Install

### OpenWrt 25.12 (apk)

```sh
# Add signing key
wget -qO /etc/apk/keys/proxy-arp-apk.pem \
  https://porech.github.io/luci-app-proxy-arp/proxy-arp-apk.pem

# Add feed
echo "https://porech.github.io/luci-app-proxy-arp/25.12/packages.adb" \
  >> /etc/apk/repositories.d/customfeeds.list

# Install
apk update
apk add luci-app-proxy-arp
```

### OpenWrt 24.10 (opkg)

```sh
# Add signing key
wget -qO /etc/opkg/keys/89400a7a4cc5f2c8 \
  https://porech.github.io/luci-app-proxy-arp/proxy-arp-repo.pub

# Add feed
echo "src/gz proxy-arp https://porech.github.io/luci-app-proxy-arp/24.10" \
  >> /etc/opkg/customfeeds.conf

# Install
opkg update
opkg install luci-app-proxy-arp
```

Then open LuCI and navigate to **Network → Proxy ARP**.

### Build from source (OpenWrt SDK)

Add to `feeds.conf.default`:

```
src-git proxy-arp https://github.com/porech/luci-app-proxy-arp.git
```

Then:

```sh
./scripts/feeds update proxy-arp
./scripts/feeds install -a -p proxy-arp
make menuconfig   # enable LuCI → Applications → luci-app-proxy-arp
make package/luci-app-proxy-arp/compile
```

## UCI reference

### Global section

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `0` | Master switch for all Proxy ARP entries |

### Instance section

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `enabled` | boolean | no | Enable this entry (default: `1`) |
| `mode` | string | yes | `always` or `probe` |
| `proxy_ip` | IP address | yes | The IP to answer ARP for |
| `interface` | string | yes | Interface where ARP requests are answered |
| `probe_ip` | IP address | probe only | IP to ping to detect reachability |
| `interval` | integer | no | Seconds between pings (default: `10`) |
| `timeout` | integer | no | Ping timeout in seconds (default: `2`) |
| `count` | integer | no | Pings per cycle (default: `3`) |
| `add_route` | boolean | no | Also manage a /32 host route (default: `0`) |
| `route_interface` | string | when add_route | Interface for the /32 route |

## Examples

### Static proxy for a device always behind a VPN

A server (192.168.1.50) is permanently at a remote office, reachable via WireGuard tunnel `wg0`:

```
config proxy-arp 'global'
    option enabled '1'

config instance 'server'
    option enabled '1'
    option mode 'always'
    option proxy_ip '192.168.1.50'
    option interface 'br-lan'
```

### Dynamic proxy for a roaming device

A laptop (192.168.1.100) sometimes moves to a remote site connected via a VPN gateway with tunnel address 10.0.0.2. When the remote gateway is reachable, the laptop is remote and needs Proxy ARP + a route:

```
config instance 'laptop'
    option enabled '1'
    option mode 'probe'
    option proxy_ip '192.168.1.100'
    option interface 'br-lan'
    option probe_ip '10.0.0.2'
    option add_route '1'
    option route_interface 'wg0'
    option interval '10'
```

### Public IP forwarding through VPN

Forward public IP 203.0.113.50 through a tunnel to a remote site:

```
config instance 'public_ip'
    option enabled '1'
    option mode 'probe'
    option proxy_ip '203.0.113.50'
    option interface 'eth0'
    option probe_ip '10.0.0.2'
    option add_route '1'
    option route_interface 'wg0'
```

## Requirements

- OpenWrt 24.10 or 25.12 (firewall4 / nftables)
- `luci-base`
- `ip-full`

## License

MIT
