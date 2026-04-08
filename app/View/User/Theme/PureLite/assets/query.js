!function () {
    const $orderList = $(".order-list");

    if (!$orderList.length) {
        return;
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (match) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;"
            }[match];
        });
    }

    function getTradeNo($orderItem) {
        const tradeNo = $.trim($orderItem.find(".order-no-text").first().text());
        return tradeNo || "order";
    }

    function getSecretLines(content) {
        return String(content ?? "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map(function (line) {
                return $.trim(line);
            })
            .filter(function (line) {
                return line !== "";
            });
    }

    function getAllSecretText($panel) {
        return $panel.find(".purelite-secret-line-code").map(function () {
            return $(this).text();
        }).get().join("\n");
    }

    function copyText(text, successMessage) {
        if (!text) {
            message.error("没有可复制的卡密");
            return;
        }

        if (typeof util !== "undefined" && typeof util.copyTextToClipboard === "function") {
            util.copyTextToClipboard(text, function () {
                message.success(successMessage);
            });
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                message.success(successMessage);
            }).catch(function () {
                message.error("复制失败，请稍后重试");
            });
            return;
        }

        const $temp = $("<textarea>").css({
            position: "fixed",
            top: "-9999px",
            left: "-9999px"
        }).val(text);

        $("body").append($temp);
        $temp.trigger("focus").trigger("select");

        try {
            document.execCommand("copy");
            message.success(successMessage);
        } catch (error) {
            message.error("复制失败，请手动复制");
        }

        $temp.remove();
    }

    function downloadText(filename, text) {
        if (!text) {
            message.error("没有可下载的卡密");
            return;
        }

        const blob = new Blob([text], {type: "text/plain;charset=utf-8;"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    function buildSecretPanel(lines, tradeNo) {
        const safeTradeNo = String(tradeNo).replace(/[^\w-]+/g, "_");
        const rows = lines.map(function (line, index) {
            const lineNumber = index + 1;
            const escapedLine = escapeHtml(line);

            return `
<div class="purelite-secret-row">
    <span class="purelite-secret-line-index">#${lineNumber}</span>
    <div class="purelite-secret-line-box">
        <code class="purelite-secret-line-code">${escapedLine}</code>
    </div>
    <button type="button" class="purelite-secret-row-copy" aria-label="复制第 ${lineNumber} 条卡密">
        <i class="fa-duotone fa-regular fa-copy"></i>
        <span>复制</span>
    </button>
</div>`;
        }).join("");

        return `
<div class="purelite-secret-panel" data-trade-no="${escapeHtml(tradeNo)}" data-filename="card-secret-${safeTradeNo}.txt">
    <div class="purelite-secret-toolbar">
        <div class="purelite-secret-summary">
            <strong class="purelite-secret-summary-title">卡密信息</strong>
            <span class="purelite-secret-summary-count">已展示 ${lines.length} 条</span>
        </div>
        <div class="purelite-secret-toolbar-actions">
            <button type="button" class="purelite-secret-toolbar-btn purelite-secret-copy-all">
                <i class="fa-duotone fa-regular fa-copy"></i>
                <span>复制全部</span>
            </button>
            <button type="button" class="purelite-secret-toolbar-btn primary purelite-secret-download-all">
                <i class="fa-duotone fa-regular fa-download"></i>
                <span>下载全部卡密</span>
            </button>
        </div>
    </div>
    <div class="purelite-secret-list">
        ${rows}
    </div>
</div>`;
    }

    function enhanceSecretDisplay(node) {
        const $display = $(node);

        if ($display.data("pureliteSecretEnhanced")) {
            return;
        }

        const lines = getSecretLines($display.text());
        if (!lines.length) {
            return;
        }

        const tradeNo = getTradeNo($display.closest(".order-item"));
        $display.data("pureliteSecretEnhanced", true);
        $display.replaceWith(buildSecretPanel(lines, tradeNo));
    }

    function enhanceAllSecrets(scope) {
        $(scope).find(".card-display").each(function () {
            enhanceSecretDisplay(this);
        });
    }

    $(document).off("click", ".purelite-secret-row-copy").on("click", ".purelite-secret-row-copy", function () {
        const secret = $(this).siblings(".purelite-secret-line-box").find(".purelite-secret-line-code").text();
        copyText(secret, "卡密已复制");
    });

    $(document).off("click", ".purelite-secret-copy-all").on("click", ".purelite-secret-copy-all", function () {
        const $panel = $(this).closest(".purelite-secret-panel");
        copyText(getAllSecretText($panel), "已复制全部卡密");
    });

    $(document).off("click", ".purelite-secret-download-all").on("click", ".purelite-secret-download-all", function () {
        const $panel = $(this).closest(".purelite-secret-panel");
        downloadText($panel.data("filename") || "card-secret.txt", getAllSecretText($panel));
    });

    enhanceAllSecrets(document);

    new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) {
                    return;
                }

                if ($(node).is(".card-display")) {
                    enhanceSecretDisplay(node);
                    return;
                }

                enhanceAllSecrets(node);
            });
        });
    }).observe($orderList[0], {
        childList: true,
        subtree: true
    });
}();
