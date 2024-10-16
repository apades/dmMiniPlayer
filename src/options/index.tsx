import { openSettingPanel } from "@root/store/config";
import '@apad/setting-panel/lib/index.css'
import { createElement } from "@root/utils";

const el = createElement('div')
document.body.appendChild(el)
openSettingPanel(el)