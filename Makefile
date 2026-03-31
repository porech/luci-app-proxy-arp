include $(TOPDIR)/rules.mk

PKG_VERSION:=1.0.0
PKG_RELEASE:=1

LUCI_TITLE:=LuCI support for Proxy ARP
LUCI_DESCRIPTION:=Manage Proxy ARP entries via LuCI. Supports static (always-on) and probe-based (ping-triggered) proxy ARP, with optional /32 route management. Useful for making remote devices appear on local networks via VPN tunnels.
LUCI_DEPENDS:=+luci-base +ip-full

PKG_LICENSE:=MIT
PKG_MAINTAINER:=Alessandro Rinaldi

include $(TOPDIR)/feeds/luci/luci.mk

$(eval $(call BuildPackage,luci-app-proxy-arp))
