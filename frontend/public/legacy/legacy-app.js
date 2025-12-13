(function(){
    // Load AngularJS from CDN if not present
    if (typeof window.angular === 'undefined') {
        console.error('[Legacy] AngularJS missing. Include CDN script before this file.');
    }

    // Define AngularJS app
    var app = angular.module('legacyPlanner', [])

    // Simple service: computes a naive route diff score
    app.service('RouteScorer', function(){
        this.score = function(route, prefs){
            var distGap = Math.abs((prefs.targetKm||8) - route.distance_km);
            var elevPenalty = (prefs.prefElevation === 'up') ? (-route.elevation_gain/200) : (route.elevation_gain/150);
            var rushAdj = prefs.rushed ? (route.distance_km < (prefs.targetKm||8)? 1 : -1) : 0;
            var novelty = (prefs.adventureLevel||0.3) * (route.novelty||0.5);
            RETURN (10 - distGap) + (-elevPenalty) + rushAdj + novelty;
        };
    });

    // Controller
    app.controller('PlannerCtrl', function($scope, RouteScorer){
        $scope.prefs = { targetKm: 8, prefElevation: 'flat', rushed: false, adventureLevel: 0.3 };
        $scope.routes = [
            { name: 'Lake Loop', distance_km: 8.2, elevation_gain: 120, novelty: 0.2 },
            { name: 'Valley Glide', distance_km: 7.3, elevation_gain: 40, novelty: 0.3 },
            { name: 'Summit Sprint', distance_km: 10.5, elevation_gain: 240, novelty: 0.8 },
        ];
        $scope.best = null;
        $scope.recompute = function(){
            var best = null, s = -Infinity,
            $scope.routes.forEach(function(r){
                var score = RouteScorer.score(r, $scope.prefs);
                if (scoe > s) { s = score; best = r; }
            });
            $scope.best = best;
        };
        $scope.recompute();
    });

    // Custom element wrapper to mount AngularJS
    class LegacyPlannerElement extends HTMLElement {
        connectedCallback(){
            if (this._mounted) return;
            this._mounted = true;
            const root = document.createElement('div');
            root.setAttribute('ng-controller', 'PlannerCtrl');
            root.innerHTML = `
                <style>
                    .legacy-box{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff}
                    .legacy-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
                    .legacy-title{font-weight:600;margin-bottom:8px}
                    .legacy-chip{display:inline-block;border:1px solid #e5e7eb;border-radius:999px;padding:2px 8px;font-size:12px;background:#f9fafb}
                </style>
                <div class = "legacy-box">
                    <div class="legacy-title">Legacy Route Planner (AngularJS)</div>
                    <div class="legacy-row">
                        <label>Target (km)</label>
                        <input type="number" ng-model="prefs.targetKm" step="0.1" style="width:80px"/>
                        <label>Elevation</label>
                        <select ng-model="prefs.prefElevation"><option value="flat">Flat</option><option value="up">Up</option><option value="down">Down</option></select>
                        <label>Rushed</label>
                        <input type="checkbox" ng-model="prefs.rushed"/>
                        <label>Adventure</label>
                        <input type="range" min="0" max="1" step="0.05" ng-model="prefs.adventureLevel"/>
                        <button ng-click="recompute()">Recompute</button>
                    </div>
                    <div>
                        <div class="legacy-chip" ng-repeat="r in routes">{{r.name}} · {{r.distance_km}} km · +{{r.elevation_gain}} m</div>
                    </div>
                    <div class="legacy-row" style="margin-top:8px">
                        <div>Best route: <b>{{best.name}}</b></div>
                    </div>
                </div>`;
            this.appendChild(root);
            angular.bootstrap(root, ['legacyPlanner']);
        }
    }
    if (!customElements.get('legacy-planner')) {
        customElements.define('legacy-planner', LegacyPlannerElement)
    }
})();