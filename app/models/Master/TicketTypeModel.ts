/**
 * 券種マスタモデル
 *
 * 券種マスタの管理するためのモデルです
 *
 * @export
 * @class TicketTypeModel
 */
import MasterBaseModel from './MasterBaseModel';
export default class TicketTypeModel extends MasterBaseModel {
    /**
     * ticketNameJa: サイト表示用券種名(string(64))
     */
    public ticketNameJa: string = '';
    /**
     * ticketNameKana: サイト表示用券種名英(string(64))
     */
    public ticketNameKana: string = '';
    /**
     * ticketNameEn: 管理用券種名(string(64))
     */
    public ticketNameEn: string = '';
    /**
     * ticketPrice: 金額(number(10))
     */
    public ticketPrice: number;
    /**
     * descriptionJa: 補足説明(string(64))
     */
    public descriptionJa: string = '';
    /**
     * descriptionEn: 補足説明英(string(64))
     */
    public descriptionEn: string = '';
    /**
     * indicatorColor: 入場時表示カラー(string(7))
     */
    public indicatorColor: string = '';
    /**
     * createdAt: 登録日(Date(10))
     */
    public createdAt: Date = new Date();
}
