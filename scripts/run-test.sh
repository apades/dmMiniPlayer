# 检查mkcert有没有安装
if ! command -v mkcert >/dev/null 2>&1; then
    echo "没有安装mkcert，去Chocolatey装一个"
    exit 0
fi
# 生成localhost https key
test -z "$(ls -a | grep .pem)" && echo "没有https key，正在生成一个" && mkcert.exe localhost
vite serve -c ./src/test/vite.config.js ./src/test