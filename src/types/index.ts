export interface SwaggerInfo {
  title?: string;
  description?: string;
  version?: string;
}

export interface SwaggerDoc {
  openapi?: string;
  info?: SwaggerInfo;
  apiList: Array<{
    module: string;
    path: string;
    method: string;
    summary: string;
    parameters: Array<{
      name: string;
      in: string;
      required: boolean;
      type: string;
    }>;
    responses: {
      code: number;
      data: any;
      msg: string;
    };
  }>;
}
