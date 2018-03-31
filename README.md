# ss-redir-service
Shadowsocks transparent proxy service

## Requirements

ss-redir-service will compile shadowsocks-libev when installing by npm, some dependencies should be installed first

```bash
# Installation of basic build dependencies
## Debian / Ubuntu
sudo apt-get install --no-install-recommends gettext build-essential autoconf libtool libpcre3-dev asciidoc xmlto libev-dev libc-ares-dev automake libmbedtls-dev libsodium-dev
## CentOS / Fedora / RHEL
sudo yum install gettext gcc autoconf libtool automake make asciidoc xmlto c-ares-devel libev-devel
## Arch
sudo pacman -S gettext gcc autoconf libtool automake make asciidoc xmlto c-ares libev
```

And some other packages will be used when running:

- iptables
- ipset
- dnsmasq
