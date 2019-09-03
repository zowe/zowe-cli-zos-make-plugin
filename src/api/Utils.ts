/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import * as Handlebars from "handlebars";

export class Utils {
    /**
     * Accepts the template and the properties and returns the rendered string.
     * @param properties Properties to use in the render
     * @param template The template string
     */
    public static render(properties: any, template: string): string {
        const templateRenderer: Handlebars.TemplateDelegate = Handlebars.compile(template, { noEscape: true });
        return templateRenderer(properties);
    }
}
