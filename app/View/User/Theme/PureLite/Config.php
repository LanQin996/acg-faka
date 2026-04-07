<?php
declare(strict_types=1);

namespace App\View\User\Theme\PureLite;

use App\Consts\Render;

/**
 * 轻白列表风格主题
 */
interface Config
{
    /**
     * 主题信息
     */
    const INFO = [
        "NAME" => "轻白列表",
        "AUTHOR" => "Codex",
        "VERSION" => "1.0.0",
        "WEB_SITE" => "#",
        "DESCRIPTION" => "浅色极简、列表陈列的前台商城模板",
        "RENDER" => Render::ENGINE_SMARTY
    ];

    /**
     * 主题配置项
     */
    const SUBMIT = [
        [
            "title" => "ICP 备案号",
            "name" => "icp",
            "type" => "input",
            "placeholder" => "填写后会展示在页面底部，不填写则不显示"
        ]
    ];

    /**
     * 模板映射
     */
    const THEME = [
        "INDEX" => "Index/Index.html",
        "ITEM" => "Index/Item.html",
        "QUERY" => "Index/Query.html",
        "CLOSED" => "Index/Closed.html",
    ];
}
