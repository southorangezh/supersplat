import { Container, Label } from '@playcanvas/pcui';
import { Vec3 } from 'playcanvas';

import { Events } from '../events';
import { Scene } from '../scene';
import { Splat } from '../splat';
import { localize } from './localization';
import { Tooltips } from './tooltips';

const vec = new Vec3();
const scale = new Vec3();

type ViewConfig = {
    id: string;
    label: string;
    azim: number;
    elev: number;
};

class ViewAssist extends Container {
    private views: ViewConfig[] = [
        { id: 'top', label: 'panel.view-assist.top', azim: 0, elev: -90 },
        { id: 'front', label: 'panel.view-assist.front', azim: 0, elev: 0 },
        { id: 'side', label: 'panel.view-assist.side', azim: 90, elev: 0 }
    ];

    private canvases: Map<string, HTMLCanvasElement> = new Map();

    private selection: Splat | null = null;

    private refreshToken = 0;

    constructor(events: Events, scene: Scene, tooltips: Tooltips, args = {}) {
        args = {
            ...args,
            id: 'view-assist',
            class: 'panel'
        };

        super(args);

        ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'dblclick'].forEach((eventName) => {
            this.dom.addEventListener(eventName, (event: Event) => event.stopPropagation());
        });

        const header = new Container({
            class: 'panel-header'
        });

        const icon = new Label({
            text: '\uE873',
            class: 'panel-header-icon'
        });

        const label = new Label({
            text: localize('panel.view-assist'),
            class: 'panel-header-label'
        });

        header.append(icon);
        header.append(label);

        const content = new Container({
            id: 'view-assist-content'
        });

        this.views.forEach(({ id, label }) => {
            const view = new Container({
                class: 'view-assist-view'
            });

            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 140;
            canvas.classList.add('view-assist-canvas');
            view.dom.appendChild(canvas);

            this.canvases.set(id, canvas);

            const viewLabel = new Label({
                class: 'view-assist-label',
                text: localize(label)
            });

            view.append(viewLabel);
            content.append(view);
        });

        const placeholder = new Label({
            id: 'view-assist-placeholder',
            text: localize('panel.view-assist.empty')
        });

        this.append(header);
        this.append(content);
        this.append(placeholder);

        const refresh = async () => {
            this.refreshToken++;
            const token = this.refreshToken;

            placeholder.hidden = !!this.selection;
            content.hidden = !this.selection;

            if (!this.selection) {
                this.canvases.forEach((canvas) => {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                });
                return;
            }

            const bound = this.selection.numSelected > 0 ? this.selection.selectionBound : this.selection.localBound;
            vec.copy(bound.center);

            const worldTransform = this.selection.worldTransform;
            worldTransform.transformPoint(vec, vec);
            worldTransform.getScale(scale);
            const radius = bound.halfExtents.length() * scale.x;

            for (const view of this.views) {
                if (token !== this.refreshToken) {
                    break;
                }

                const canvas = this.canvases.get(view.id);
                if (!canvas) {
                    continue;
                }

                await scene.camera.renderPreview(canvas, {
                    azim: view.azim,
                    elev: view.elev,
                    focalPoint: vec,
                    radius,
                    ortho: true
                });
            }
        };

        const updateSelection = (selection: Splat) => {
            this.selection = selection;
            refresh();
        };

        events.on('selection.changed', updateSelection);
        events.on('camera.focus', refresh);
        events.on('edit.add', refresh);
        events.on('edit.undo', refresh);
        events.on('edit.redo', refresh);
        events.on('scene.boundChanged', refresh);

        tooltips.register(this, localize('panel.view-assist.tooltip'));

        refresh();
    }
}

export { ViewAssist };
