// @ts-noinspect
// @ts-ignore
export const a = 0;

let data:any, node:any, view:any, component:any;

/*
* verified! firing twice the same SetRootFieldAction("a", 1) does not change state twice, reducer returns old state.
* same for setFieldAction
* oth not tested on array or oject values. and with access modifier -= with non-existing index
* */

/*
make sure error view display meaningful messages with code line
* prevent megacrash if someone does <Vertex data={"not a pointer"} /> or <Vertex data={1, null, undefined...} />
*/
// on rename model, update view using .$name, but only when ocl condition includes the pointer of the meta class. (directly or through instanceof, so when it's a non-generic view)


// todo: avoid creating pointedby when src and target are the same.
//  - DONE: Constructors.setPtr, setExternalPtr
//  - missing: in reducer

// todo: inject offset in a subnode with .container or some other special class, and put it everywhere in DV
// because currently in package, it is child[0].child[0], but in model it's just child[0]



// optimize actions, verify toolbox create must make only 1 compositeaction for dmodelelement and 1 for dgraphelement. thenverify transaction nested nad beign end nested
// view selection in jsx by name instead of pointer (or both)
/*
need to fix get_children to work without instanceof (LModelElement.tsx:3962:1)
or delete all DObjects without instanceof in the synchro_model.
todo: context menu object.clear() erases all values of object, if values are object contained they are deleted as well.


todo: new DObject("State" (metaclassname), {serverCounter:1, changes:[{from:this.data.name, ... blablabla, content of changes.type:values}]}


// todo: context.set('counterValue', amount);
//    and dObject.persist()


*
* */

// edgepoint creation undo crashes
/*
    preact can probably be used for dynamical views too, compiled jsx is very similar, just "h()" instead of "React.createElement()"
        https://www.syncfusion.com/blogs/post/preact-vs-react.aspx
    NO million      https://www.reddit.com/r/reactjs/comments/1468v2a/comment/jnpjtl8/
    ? mikado        performance very promising, but syntax very different, closer to angular ngfor, ngif or older style php templating liberaries.
                    https://github.com/nextapps-de/mikado/
benchmark   https://krausest.github.io/js-framework-benchmark/current.html

PureComponent ad memo() both use Object.is() to shallow compare, but they re-defined it with a polyfill.
so overriding it will be of no use, they call their own identical function

 todo:
 skip render for overlapped nodes & out of visible graph area, edges whose start and end are invisible/missing nodes
 if edge have only 1 end outside visible area, that node should be rendered as an empty box, present in graph with correct size but no content
jsx rendering {data.values} array directly crashed

done:
- light mode:
    - disabled measurable events
    - renders only model, package, classifiers
    - lazy size update
    - edge suggestions disabled except for inheritance, but manually reference added edges are allowed


todo:
- modalità light: cambia viste per nascondere attrib, operation etc. suggestedEdges in model view is not used at all. activate window.isLoading...
 or make it so it works like this without making new lightmode views? Graohelement or defaultnode refusing to inject view and calculate jsx of features, suggestededges res is always empty

- import ecore.ecore
- view.appliableTo (node edge, edgepoint) is not working, and is missing graph, graphvertex.   view.appliableToClasses was working i think but had DModelElement targets
- on rightclick there was "reset resizing" or something, that was needed.
- default package super buggato (check in post relase notes)
- import supports only mono-package inputs (pkg is root non-array, not subpackages either)

todo post release:
- storeSize
- up/ down rightclick won't work on m1 features
- not tested but likely bug: html id duplicate if extend and ref edge with same target (don't reference a class you are extending from the same node. no idea what can happen)
- default package è super buggato.
se trascini qualcosa in overflow, tutti gli elementi interni si spostano.
in futuro ci renderà imossibile / da incubo fare scroll / pan nel grafo.

secondo me dovremmo:
1) in model view, renderizzare i package e i sottoelementi di model.$default direttamente nella vista del modello, NON renderizzando $default esplicitamente. lo saltiamo.
2) però adesso abbiamo selezionato come radice il modello invece di un package, quindi nella toolbox a sx dobbiamo istruirlo per fargli creare classi quando è selezionato un modello, e buttargliele in model.$package

feature done:
- toolbar edgepoint
- m1 edges

bugfixes:
- edgepoint must not hide when resizing
- nodes not draggable after changing view
- many bugs on literals
- node size resetting when changing view
- edges isVertexOverlap properties was not working properly when edge was cross-package.



OLD

done
- hide edgepoint if edge is not selected / hovered
- meta-info on features to allow autogenerated structure editors
- Generic inputs (adapt input type / select according to value type)
- completed edge & edgepoint View editor (autogenerated with the 2 points above!)
- Point, Size inputs (textual version, need to do graphical one but low priority)
- measurable actions on m1 (drag, resize, update, NOT rotate)
- edge, edgepoint delay animations ( was required to fix a bug when edgepoints were hiding during resize )
- shortcuts to set values object.$featureName = value; is not valid instead of object.$featureName.values = value;
      it works with enums too setting ordinal if value is numeric, literal if value is string. can be expanded for other types.
- viewpoint highlight row when hover
- add event "onModeUpdate" to do model -> nodepos (which cannot be done in jsx because is the very root)


bugfixes:
- fix view.father log error bug.
- m1 values were trying to access .isContainment, regardless if they were references or attributes.
- fixed data.value = 1; ( the setter )
- <Input> <Textarea> optimizations / generalizations
- loop detector if some component rerenders too much often, disables "onModelChange" until the view has been updated.

untested:
- prevent action with value = proxy from firing. it was crashing super hard in reducer function during "node.x = data;" invalid measurable event.


todo:
- ghpages deploy, tell to put build in gitignore or fix pathing wiith <base href=".">
- !!! remove function.toString() implementation shown in console output
- bug: tabindex on component root won't work?? maybe add onClick ="this.focus()" in injected props? or more generic onClick={onClick(reactevent)} and put it inside component.onClick func



when select edge, select view.edge tab
when select node, select view.node tab


todo:

coerenza conflitti:
- roolback se dal server ricevi una azione con tempo precedente all'ultima azione eseguita localmente.
  il rollback procede fino alla prima azione con timestamp più vecchio di quella ricevuta dal server. poi riesecuzione riorinando le azioni by timestamp & user id in caso di same timestamp.
- questo implica un funzionamento completo e perfetto di undo/redo.
- in reducer, edit +=, -= actions, vengono effettivamente "eseguite", ma poi modificate in:
    (+=)    "path.to.array.INDEX = value_inserted"      OR
    (-=)    "path.to.array = [value_post_deletion]"     e il server deve riceverle solo in questa forma.

- sometimes deletion by setting undefined does not work well,
   consider replacing it with a special "delete" value with unicode chars that are unlikely to be found (like "←¦dëletê┤" },
   when an action is attempting to set that val, it triggers (delete object[key]) instead. and then needs to get all pointedby and pdate them if it was inside an array (indexes moved)
   or check if array with holes are iterated without undefineds ([1, empty x4, 2] in for...in but have a[1] === undefined, a[5] === 2

all GraphElement utilities
going down;
- subVertexes
- subFields
- edges
...

going up:
- graph (rework)
- vertex
- edge (from edgepoint)

coerenza con LModelElement:
- father
- childrens
...




/// *************************                                              fixed bug log
only first package to package or package to class edge is visible
second reference edge causes eternal loop


problema con subgraphs and edges.
start.size, refers to position and size inside a subgraph (package).
but edges are rendered at model, so
- moving package does not move containing edges
- having package not in position 0,0 makes edges inside him misplaced.

solutions:
- render edges inside topmost package
---- problem: how to handle cross-package refs?
---- restrictions on edge z-index as the start and end location have different stacking contexts. (unfixable)

- render edge paths with htmlSize (way to go? hard but all fixable) or use outernmostSize
---- problem: resizing graph tab does not update edge positions
---- problem: moving a package does not update edges
-------- solution: on package move, get all deges starting or ending in his sueleements and update them


- when dragging class vertex node inside a package, then asking his size on console returns x:0, y:0 and resets his position
- field size inside package is wrong when package is not in coords 0,0 position is relative to outer graph instead of graphvertex
- subpackage broken cannot drag or display subelements, but adds them (visible from tree view)




Error from chokidar (C:\node_modules): Error: EBUSY: resource busy or locked, lstat 'C:\hiberfil.sys
means some import is ill-defined looking for a path inside a library instead of importing from library root.
like import {a} from "library/deephath/notallowed"



WARNING: tree library modified the object you pass in tree.parse() function. it sorts elements in the array with key provided in constructor configuration
// model[this.config.childrenPropertyName] = mergeSort(  ...etc



*/
