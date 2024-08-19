export interface BilibiliFollowApiItem {
  mid: number
  attribute: number
  mtime: number
  tag: null
  special: number
  contract_info: ContractInfo
  uname: string
  face: string
  sign: string
  face_nft: number
  official_verify: OfficialVerify
  vip: Vip
  name_render: ContractInfo
  nft_icon: string
  rec_reason: string
  track_id: string
  follow_time: string
}
interface ContractInfo {}
interface OfficialVerify {
  type: number
  desc: string
}
interface Vip {
  vipType: number
  vipDueDate: number
  dueRemark: string
  accessStatus: number
  vipStatus: number
  vipStatusWarn: string
  themeType: number
  label: Label
  avatar_subscript: number
  nickname_color: string
  avatar_subscript_url: string
}
interface Label {
  path: string
  text: string
  label_theme: string
  text_color: string
  bg_style: number
  bg_color: string
  border_color: string
}

export type BilibiliFollowApiData = {
  code: number
  data: {
    list: BilibiliFollowApiItem[]
    re_version: number
    total: number
  }
  message: string
  ttl: number
}

export type BilibiliFollowData = {
  mid: number
  name: string
  avatar: string
}
