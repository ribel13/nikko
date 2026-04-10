module("luci.controller.nikki", package.seeall)

function index()
    -- Menu utama di LuCI
    entry({"admin", "services", "nikki"}, firstchild(), _("Nikki"), 2)
    entry({"admin", "services", "nikki", "backup"}, template("backup"), _("Backup"), 45).leaf = true
    entry({"admin", "services", "nikki", "do_backup"}, call("action_backup")).leaf = true
    entry({"admin", "services", "nikki", "do_restore"}, call("action_restore")).leaf = true
end

function action_backup()
    local sys   = require "luci.sys"
    local fs    = require "nixio.fs"
    local http  = require "luci.http"
    local ltn12 = require "luci.ltn12"

    local date = os.date("%Y-%m-%d_%H-%M-%S")
    local backup_file = "/tmp/nikki_backup-" .. date .. ".tar.gz"

    sys.call("tar -czf " .. backup_file .. " /etc/config/nikki /etc/nikki/profiles /etc/nikki/run >/dev/null 2>&1")

    http.header('Content-Disposition', 'attachment; filename="' .. fs.basename(backup_file) .. '"')
    http.prepare_content("application/gzip")
    ltn12.pump.all(ltn12.source.file(io.open(backup_file, "r")), http.write)

    fs.remove(backup_file)

end

function action_restore()
    local http = require "luci.http"
    local sys  = require "luci.sys"
    local fs   = require "nixio.fs"

    local file = "/tmp/nikki_restore.tar.gz"
    local fp

    http.setfilehandler(function(meta, chunk, eof)
        if not fp and meta and meta.name == "upload" then
            fp = io.open(file, "w")
        end
        if fp and chunk then
            fp:write(chunk)
        end
        if fp and eof then
            fp:close()
        end
    end)

    if http.formvalue("upload") then
        sys.call("tar -xzf " .. file .. " -C / >/dev/null 2>&1")
        fs.remove(file)
    end

    http.redirect(luci.dispatcher.build_url("admin/services/nikki/backup") .. "?status=restore_ok")
end

