import BaseUser from './base';

/**
 * マスタ管理者ユーザー
 */
export default class MasterAdminUser extends BaseUser {
    public static AUTH_SESSION_NAME: string = 'CHEVREFrontendMasterAuth';

    public static PARSE(session: Express.Session | undefined): MasterAdminUser {
        const user = new MasterAdminUser();
        // セッション値からオブジェクトにセット
        if (session !== undefined && session.hasOwnProperty(MasterAdminUser.AUTH_SESSION_NAME)) {
            Object.keys(session[MasterAdminUser.AUTH_SESSION_NAME]).forEach((propertyName) => {
                (<any>user)[propertyName] = session[MasterAdminUser.AUTH_SESSION_NAME][propertyName];
            });
        }

        return user;
    }
}
