
// da ottimizzare:
/*
get_cumulativezoom get_typestr, get_values, get_model, get_instanceof, get_segments, get_children_idlist, get_typestr

*/

(ret)=> {
// ** preparations and default behaviour here ** //
// ret.data = data
    ret.view = view
// data, edge, view are dependencies by default. delete the line(s) above if you want to remove them.
// add preparation code here (like for loops to count something), then list the dependencies below.

    ret.getPosition = () => {
        if (!ret.segments || !ret.segments.all || !ret.segments.all.length) return null;
        const all = ret.segments.all;

        const getSector = (p1 = {x: 0, y: 0}, p2 = {x: 0, y: 0}) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            if (dx === 0 && dy === 0) return null;
            let a = Math.atan2(dy, dx);
            if (a < 0) a += 2 * Math.PI;
            // 64 sectors (π/32 each), with half-step offset
            return Math.floor(((a + Math.PI / 64) % (2 * Math.PI)) / (Math.PI / 32)) + 1;
        };
        const findRule = (rules, s) => {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                if (s >= r.min && s <= r.max) return r;
            }
            return null;
        };

// START: sectors → (dx, dy, align)
        const startRules = [
            {min: 1, max: 3, dx: +5, dy: -25, align: 'left'},
            {min: 4, max: 5, dx: +5, dy: -20, align: 'left'},
            {min: 6, max: 6, dx: +15, dy: -20, align: 'left'},
            {min: 7, max: 17, dx: -5, dy: +5, align: 'right'},
            {min: 18, max: 20, dx: +5, dy: +5, align: 'left'},
            {min: 21, max: 25, dx: 0, dy: +5, align: 'left'},
            {min: 26, max: 28, dx: -5, dy: +5, align: 'left'},
            {min: 29, max: 29, dx: -5, dy: -25, align: 'left'},
            {min: 30, max: 32, dx: -5, dy: -20, align: 'right'},
            {min: 33, max: 35, dx: -5, dy: +5, align: 'right'},
            {min: 36, max: 37, dx: -5, dy: +2, align: 'right'},
            {min: 38, max: 38, dx: -5, dy: 0, align: 'right'},
            {min: 39, max: 49, dx: +5, dy: -25, align: 'left'},
            {min: 50, max: 60, dx: -5, dy: -25, align: 'right'},
            {min: 61, max: 64, dx: +5, dy: +5, align: 'left'},
        ];

        const getStart = (p1 = {x: 0, y: 0}, sector) => {
            const r = findRule(startRules, sector);
            if (!r) return null;
            return {x: p1.x + r.dx, y: p1.y + r.dy, align: r.align, section: sector};
        };
// END: sectors → (dx, dy, align)

        const endRules = [
            {min: 1, max: 1, dx: -5, dy: -25, align: 'right'},
            {min: 2, max: 5, dx: -5, dy: +5, align: 'right'},
            {min: 6, max: 17, dx: +5, dy: -25, align: 'left'},
            {min: 18, max: 25, dx: -5, dy: -25, align: 'right'},
            {min: 26, max: 28, dx: -3, dy: -25, align: 'right'},
            {min: 29, max: 29, dx: +5, dy: -25, align: 'right'},
            {min: 30, max: 32, dx: +5, dy: +5, align: 'left'},
            {min: 33, max: 37, dx: +5, dy: -25, align: 'left'},
            {min: 38, max: 38, dx: +10, dy: -25, align: 'left'},
            {min: 39, max: 48, dx: -5, dy: +5, align: 'right'},
            {min: 49, max: 49, dx: -10, dy: +5, align: 'right'},
            {min: 50, max: 60, dx: +10, dy: +5, align: 'left'},
            {min: 61, max: 64, dx: -10, dy: -25, align: 'right'},
        ];

        const getEnd = (p2 = {x: 0, y: 0}, sector) => {
            const r = findRule(endRules, sector);
            if (!r) return null;
            return {x: p2.x + r.dx, y: p2.y + r.dy, align: r.align, section: sector};
        };

        const first = all[0];
        const last = all[all.length - 1];
        console.log('edge ud first', {first});
        const p1 = first.start.pt;
        const p2 = last.end.pt;
        let sector, start, end;
        if (all.length === 1) {
            sector = getSector(p1, p2);
            start = getStart(p1, sector);
            end = getEnd(p2, sector);
        } else {
            // choose an internal reference point consistently
            const pA = all[1].start?.pt ?? all[1].pt ?? p1;
            sector = getSector(p1, pA);
            start = getStart(p1, sector);
            const pB = all[all.length - 1].start?.pt ?? all[all.length - 1].pt ?? p2;
            sector = getSector(pB, p2);
            end = getEnd(p2, sector);
        }
        return {start, end};
    };

    console.log('Edge UD:', {node, data, view, ret});
// ** declarations here ** //

    ret.start = edge.start
    ret.end = edge.end
    ret.segments = edge.segments
    ret.position = ret.getPosition()
    ret.edgeview = view?.id
    ret.sPos = ret.position ? ret.position.start : {x: 0, y: 0, align: 'left'}
    ret.ePos = ret.position ? ret.position.end : {x: 0, y: 0, align: 'right'}

}

export class test{

    static debugcompile(){


    }


}