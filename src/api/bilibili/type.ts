export enum MomentType {
  Video = 8,
  Article = 64,
  Bangumi = 512,
  PGC = 4097,
  Movie = 4098,
  TvShow = 4099,
  ChineseAnime = 4100,
  Documentary = 4101,
}

export type BiliLiteItem = {
  cover: string
  offset_dynamic_id: string
  bid: string
  title: string
  user: string
}

export type BiliLiveLiteItem = {
  cover: string
  title: string
  user: string
  link: string
  roomid: number
}
