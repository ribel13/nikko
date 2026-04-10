'use strict';
'require form';
'require view';
'require uci';
'require poll';
'require tools.nikki as nikki';

const colors = {
    blue: 'linear-gradient(135deg, #B70FF2, #3600FF)',
    violet: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    red: 'linear-gradient(135deg, #a78bfa, #6366f1)',
    bgStatus: 'rgba(139, 92, 246, 0.1)'
};

function renderStatus(running){
    return updateStatus(E('input',{
        id:'core_status',
        style:`border: 2px solid #B70FF2; border-radius: 12px; padding: 6px 12px; font-weight: 800; font-size: 14px; text-align: center; background: ${colors.bgStatus}; width: 190px; outline: none; transition: all 0.3s ease;`,
        readonly:''
    }),running);
}

function updateStatus(element,running){
    if(element){
        element.style.color = running ? '#6366f1' : '#a78bfa';
        element.style.boxShadow = running ? '0 0 15px rgba(99, 102, 241, 0.5)' : '0 0 15px rgba(167, 139, 250, 0.3)';
        element.value = running ? _('⚡ ONLINE BOSS ⚡') : _('💤 OFFLINE BOSS 💤');
    }
    return element;
}

function styleButton(btn, type) {
    if (!btn) return;
    const baseStyle = `border: none !important; border-radius: 10px !important; padding: 10px 20px !important; font-weight: bold !important; font-size: 13px !important; color: white !important; cursor: pointer !important; transition: all 0.2s ease !important; margin: 4px !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;`;
    btn.setAttribute('style', baseStyle + `background: ${colors[type]} !important;`);
    btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; btn.style.filter = 'brightness(1.1)'; };
    btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.filter = 'brightness(1)'; };
}

return view.extend({
    load:function(){
        return Promise.all([uci.load('nikki'),nikki.version(),nikki.status(),nikki.listProfiles()]);
    },
    render:function(data){
        const subscriptions = uci.sections('nikki','subscription');
        const appVersion = data[1].app ?? '';
        const coreVersion = data[1].core ?? '';
        const running = data[2];
        const profiles = data[3];
        let m, s, o;

        m = new form.Map('nikki', _(''));

        s = m.section(form.TableSection, 'status', _('<strong style="color:#4D4D4D; padding-left: 12px; font-size: 23px;">📊 MONITORING SYSTEM</strong>'));
        s.anonymous = true;

        o = s.option(form.Value, '_app_version', _('App Version'));
        o.readonly = true;
        o.load = function(){ return `📦 ${appVersion}`; };

        o = s.option(form.Value, '_core_version', _('Core Version'));
        o.readonly = true;
        o.load = function(){ return `⚙️ ${coreVersion}`; };

        o = s.option(form.DummyValue, '_core_status', _('Core Status'));
        o.cfgvalue = function(){ return renderStatus(running); };

        poll.add(function(){
            return L.resolveDefault(nikki.status()).then(function(running){
                updateStatus(document.getElementById('core_status'), running);
            });
        });

        o = s.option(form.Button, 'restart');
        o.inputtitle = _('🔄 Mulai Ulang');
        o.render = function(s_id, o_id, title) {
            let btn = this.super('render', s_id, o_id, title);
            setTimeout(() => styleButton(btn.querySelector('input'), 'red'), 150);
            return btn;
        };
        o.onclick = function(){ return nikki.restart(); };

        o = s.option(form.Button, 'update_dashboard');
        o.inputtitle = _('✨ Update Dashboard');
        o.render = function(s_id, o_id, title) {
            let btn = this.super('render', s_id, o_id, title);
            setTimeout(() => styleButton(btn.querySelector('input'), 'violet'), 150);
            return btn;
        };
        o.onclick = function(){ return nikki.updateDashboard(); };

        o = s.option(form.Button, 'open_dashboard');
        o.inputtitle = _('🌐 Buka Dashboard');
        o.render = function(s_id, o_id, title) {
            let btn = this.super('render', s_id, o_id, title);
            setTimeout(() => styleButton(btn.querySelector('input'), 'blue'), 150);
            return btn;
        };
        o.onclick = function(){ return nikki.openDashboard(); };

        s = m.section(form.NamedSection, 'config', 'config', _('<strong style="color:#4D4D4D; padding-left: 12px; font-size: 23px;">🛠️ KONFIGURASI</strong>'));

        o = s.option(form.Flag, 'enabled', _('⚡ Aktifkan Layanan'));
        o.rmempty = false;

        o = s.option(form.ListValue, 'profile', _('📂 Pilih Profil Koneksi'));
        o.optional = true;
        for(const profile of profiles){ o.value('file:'+profile.name, `📄 File: ${profile.name}`); };
        for(const sub of subscriptions){ o.value('subscription:'+sub['.name'], `☁️ Sub: ${sub.name || sub['.name']}`); };

        o = s.option(form.Value, 'start_delay', _('⏱️ Waktu Tunda (Detik)'));
        o.datatype = 'uinteger';

        o = s.option(form.Flag, 'scheduled_restart', _('📅 Jadwal Restart Otomatis'));
        o.rmempty = false;

        o = s.option(form.Value, 'cron_expression', _('📝 Cron Expression'));
        o.retain = true;
        o.depends('scheduled_restart', '1');

        o = s.option(form.Flag, 'test_profile', _('🔍 Test Profile Sebelum Run'));
        o.rmempty = false;

        const renderedMap = m.render();

        return renderedMap.then(function(node) {
            const footer = E('div', { 
                style: 'margin-top: 40px; padding: 20px; text-align: center; border-top: 1px solid #eee;' 
            }, [
                E('p', { 
                    style: 'margin: 5px 0; font-size: 14px; font-weight: 900; background: linear-gradient(to right, #B70FF2, #3600FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' 
                }, 'FRDMX-Wrt'),
            ]);
            node.appendChild(footer);
            return node;
        });
    }
});
