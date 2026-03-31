'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	render: function () {
		var m, s, o;

		m = new form.Map('proxy-arp', _('Proxy ARP'),
			_('Manage Proxy ARP entries for IP addresses on specific interfaces. ' +
			  'When Proxy ARP is enabled for an IP, this router will answer ARP requests ' +
			  'for that IP on the chosen interface, making remote devices appear as if they ' +
			  'are on the local network.') + '<br/><br/>' +
			_('Common use cases:') +
			'<ul>' +
			'<li>' + _('Connecting two sites with the same subnet through a VPN tunnel') + '</li>' +
			'<li>' + _('Making a remote device (behind a VPN) reachable on the local LAN') + '</li>' +
			'<li>' + _('Forwarding a public IP through a tunnel to a remote gateway') + '</li>' +
			'</ul>');

		s = m.section(form.NamedSection, 'global', 'proxy-arp', _('Global Settings'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable'),
			_('Master switch for all Proxy ARP entries. When disabled, all proxy ARP entries ' +
			  'and associated routes are removed.'));
		o.rmempty = false;

		s = m.section(form.GridSection, 'instance', _('Proxy ARP Entries'));
		s.addremove = true;
		s.anonymous = false;
		s.sortable = true;
		s.nodescriptions = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '1';
		o.editable = true;

		o = s.option(form.ListValue, 'mode', _('Activate this entry'),
			_('Choose when this Proxy ARP entry should be active. ' +
			  '\"Always active\" keeps it enabled permanently — use for devices that are ' +
			  'always behind the tunnel. \"Only when a host is reachable\" monitors a remote ' +
			  'IP via ping and only enables the entry while that host responds — use for ' +
			  'devices that may roam between local and remote.'));
		o.value('always', _('Always active'));
		o.value('probe', _('Only when a host is reachable'));
		o.default = 'always';

		o = s.option(form.Value, 'proxy_ip', _('Proxy IP'),
			_('The IP address to answer ARP requests for. When another device on the local ' +
			  'network asks \"who has this IP?\", this router will reply with its own MAC address, ' +
			  'causing traffic for this IP to be sent to this router.'));
		o.rmempty = false;
		o.datatype = 'ipaddr';

		o = s.option(form.Value, 'interface', _('Interface'),
			_('The network interface where ARP requests are answered. This should be the ' +
			  'interface facing the devices that need to reach the proxied IP ' +
			  '(typically a LAN or bridge interface).'));
		o.rmempty = false;
		o.validate = function (section_id, value) {
			if (!/^[a-zA-Z0-9_.-]+$/.test(value))
				return _('Interface name can only contain letters, numbers, underscores, hyphens, and dots');
			return true;
		};

		o = s.option(form.Value, 'probe_ip', _('Probe IP'),
			_('IP address to ping periodically. When this host responds, the Proxy ARP ' +
			  'entry is enabled. When it stops responding, the entry is removed. ' +
			  'Typically the VPN address of the remote gateway or device.'));
		o.datatype = 'ipaddr';
		o.depends('mode', 'probe');
		o.rmempty = true;

		o = s.option(form.Flag, 'add_route', _('Manage route'),
			_('Also add a /32 host route pointing to a specified interface when the proxy ' +
			  'entry is active. Enable this if the router needs to know where to forward ' +
			  'the traffic (e.g. through a VPN tunnel interface). Disable if routing is ' +
			  'already handled by your network configuration.'));
		o.default = '0';

		o = s.option(form.Value, 'route_interface', _('Route interface'),
			_('The interface to route traffic to for the proxied IP. A /32 host route ' +
			  'will be added pointing to this interface (e.g. a WireGuard tunnel).'));
		o.depends('add_route', '1');
		o.rmempty = true;
		o.validate = function (section_id, value) {
			if (value && !/^[a-zA-Z0-9_.-]+$/.test(value))
				return _('Interface name can only contain letters, numbers, underscores, hyphens, and dots');
			return true;
		};

		o = s.option(form.Value, 'interval', _('Ping interval (s)'),
			_('How often to check if the probe host is reachable, in seconds.'));
		o.default = '10';
		o.datatype = 'uinteger';
		o.depends('mode', 'probe');
		o.optional = true;

		o = s.option(form.Value, 'timeout', _('Ping timeout (s)'),
			_('How long to wait for a ping reply before considering the host unreachable.'));
		o.default = '2';
		o.datatype = 'uinteger';
		o.depends('mode', 'probe');
		o.optional = true;

		o = s.option(form.Value, 'count', _('Ping count'),
			_('Number of ping packets to send per probe cycle.'));
		o.default = '3';
		o.datatype = 'uinteger';
		o.depends('mode', 'probe');
		o.optional = true;

		return m.render();
	}
});
