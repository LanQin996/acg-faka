!function () {
    const $switchCategory = $(".switch-category");
    const $itemList = $(".item-list");
    const $searchInput = $(".item-search-input");
    const $searchSubmit = $(".purelite-search-submit");
    const $searchClear = $(".purelite-search-clear");
    const $currentCategory = $(".purelite-current-category");
    const categoryId = getVar("CAT_ID");

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

    function getStockWidth(state) {
        if (state <= 0) {
            return 0;
        }

        if (state === 1) {
            return 34;
        }

        if (state === 2) {
            return 67;
        }

        return 96;
    }

    function getStockText(item) {
        const state = Number(item.stock_state ?? 0);

        if (state <= 0) {
            return "暂时缺货";
        }

        if (state === 1) {
            return "库存紧张";
        }

        if (state === 2) {
            return "数量有限";
        }

        return "库存充足";
    }

    function getCategoryLabel(id) {
        const $target = $switchCategory.filter(`[data-id="${id}"]`).first();
        return $.trim($target.text()) || "全部商品";
    }

    function updateCategoryLabel(label) {
        $currentCategory.text(label || "全部商品");
    }

    function createRow(item) {
        const isSoldOut = Number(item.stock_state ?? 0) <= 0;
        const price = typeof format !== "undefined" ? format.amountRemoveTrailingZeros(item.price) : item.price;
        const deliveryClass = Number(item.delivery_way) === 0 ? "auto" : "manual";
        const deliveryText = deliveryClass === "auto" ? "自动" : "在线";
        const actionText = isSoldOut ? "缺货" : "购买";
        const href = isSoldOut ? "javascript:void(0);" : `/item/${item.id}`;
        const stockState = Number(item.stock_state ?? 0);
        const cover = escapeHtml(item.cover || "/favicon.ico");

        return `
<a href="${href}" class="purelite-row ${isSoldOut ? "is-soldout" : ""}" data-id="${item.id}">
    <div class="purelite-row-cover">
        <img src="${cover}" alt="${escapeHtml(item.name)}" loading="lazy">
    </div>
    <div class="purelite-row-name">
        <div class="purelite-row-headline">
            <span class="purelite-row-service ${deliveryClass}">${deliveryText}</span>
            ${Number(item.recommend) === 1 ? '<span class="purelite-row-label recommend">推荐</span>' : ""}
        </div>
        <h4>${escapeHtml(item.name)}</h4>
    </div>
    <div class="purelite-row-side">
        <div class="purelite-row-price-group">
            ${Number(item.order_sold) > 0 ? `<span class="purelite-row-label sold">已售 ${escapeHtml(item.order_sold)}</span>` : ""}
            <div class="purelite-row-price">
                <span class="unit">&yen;</span>
                <strong>${price}</strong>
            </div>
        </div>
        <div class="purelite-row-stock">
            <div class="purelite-row-stock-meta">
                <span class="purelite-row-stock-title">
                    <i class="fa-duotone fa-regular fa-cube"></i>
                    库存
                </span>
                <strong>${escapeHtml(item.stock)}</strong>
            </div>
            <div class="purelite-row-progress" aria-hidden="true">
                <span style="width:${getStockWidth(stockState)}%"></span>
            </div>
            <div class="purelite-row-stock-text">${getStockText(item)}</div>
        </div>
        <div class="purelite-row-action-wrap">
            <div class="purelite-row-action ${isSoldOut ? "disabled" : ""}">
                <i class="fa-duotone fa-regular fa-bag-shopping"></i>
                <span>${actionText}</span>
            </div>
        </div>
    </div>
</a>`;
    }

    function renderEmpty(message) {
        $itemList.html(`
<div class="purelite-empty-state">
    <i class="fa-duotone fa-regular fa-box-open"></i>
    <h4>${message}</h4>
    <p>试试切换分类，或者换个关键词重新搜索。</p>
</div>`);
    }

    function renderLoading() {
        $itemList.html(`
<div class="purelite-empty-state loading">
    <i class="fa-duotone fa-regular fa-spinner-third icon-spin"></i>
    <h4>商品正在加载</h4>
    <p>请稍候，列表马上就好。</p>
</div>`);
    }

    function pushCommodityList(data) {
        $itemList.html("");

        if (!Array.isArray(data) || data.length === 0) {
            renderEmpty("没有找到对应商品");
            return;
        }

        data.forEach(item => {
            $itemList.append(createRow(item));
        });
    }

    function switchCategory(id, link = false, label = "") {
        $switchCategory.removeClass("is-primary");
        $(`a[data-id="${id}"]`).addClass("is-primary");
        updateCategoryLabel(label || getCategoryLabel(id));

        if (link) {
            history.pushState(null, "", `/cat/${id}`);
        }

        renderLoading();

        trade.getCommodityList({
            categoryId: id,
            done: data => {
                pushCommodityList(data);
            }
        });
    }

    function searchCommodity(keywords) {
        const value = String(keywords ?? "").trim();

        if (value === "") {
            layer.msg("请输入要搜索的商品关键词");
            return;
        }

        $switchCategory.removeClass("is-primary");
        updateCategoryLabel(`搜索 “${value}”`);
        renderLoading();

        trade.getCommodityList({
            keywords: value,
            done: data => {
                pushCommodityList(data);
            }
        });
    }

    switchCategory(categoryId > 0 ? categoryId : $switchCategory.first().data("id"));

    $switchCategory.on("click", function () {
        if ($(this).hasClass("is-primary")) {
            return;
        }

        switchCategory($(this).data("id"), true, $.trim($(this).text()));
    });

    $searchInput.on("keypress", function (e) {
        if (e.which === 13) {
            searchCommodity($(this).val());
        }
    });

    $searchSubmit.on("click", function () {
        searchCommodity($searchInput.val());
    });

    $searchClear.on("click", function () {
        $searchInput.val("").trigger("focus");

        const currentId = $switchCategory.filter(".is-primary").data("id") || (categoryId > 0 ? categoryId : $switchCategory.first().data("id"));
        switchCategory(currentId);
    });
}();
