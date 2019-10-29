/*
[State description]
Assume that at most one object can be placed in a tile.
`this._state`(map_state) is defined by 2-dimensional number array.
The value of `this._state[y][x]` is an object's id.
The index of `this._state[y][x]` is the object's position.

[Object id]
        -3: `Ghost`(enemy)
        -2: `Pacman`(player)
        -1: wall(obstacle)
         0: empty
 1 or more: `Food` (ID value means the size of `Food`)
                   (ID of `food` is 1)
*/

/**
 * Pacman Game Environment
 */
class Game {
    /**
     * Constructor for Pacman Game
     * @param {number[][]} map_state 
     */
    constructor(map_state, board_ui, notice_ui) {
        this._initial_state = map_state;
        this._state = this._initial_state;  // 2D number array. Current state.
        this._map = [];                     // 2D boolean array. If not wall then set to true.
        this._map_graph_tiles = [];         // Game.Tile array.
        this._turn = 0;                     // number. Elapsed turn after game start.
        this._phase = 0;                    // number. Who's turn?
            // 0: player's turn, 1: calculating state, 2: enemys' turn, 3: calculating state
        this._pacmans = [];                 // Game.Pacman array.
        this._ghosts = [];                  // Game.Ghost array.
        this._foods = [];                   // Game.Food array.
        this._done = false;                 // boolean. Is game ends?
        this._board_ui = board_ui;          // <div> element with id="board"
        this._notice_ui = notice_ui;        // <div> element with id="notice"
        this.reset();
    }

    /**
     * Resets the game.
     */
    reset() {
        this._state = this._initial_state;
        this._map = [];
        this._map_graph_tiles = [];
        this._turn = 0;
        this._phase = 0;
        this._pacmans = [];
        this._ghosts = [];
        this._foods = [];
        this._done = false;
        for (let i = 0; i < this._state.length; i++) {
            this._map.push([]);
            for (let j = 0; j < this._state[i].length; j++) {
                let id = this._state[i][j];
                if (id > 0) {
                    this._foods.push(new Game.Food(this, id, i, j));
                }
                else if (id === -2) {
                    this._pacmans.push(new Game.Pacman(this, i, j));
                }
                else if (id === -3) {
                    this._ghosts.push(new Game.Ghost(this, i, j));
                }

                if (id === -1) {
                    this._map[i].push(false);
                }
                else {
                    this._map[i].push(true);
                    this._map_graph_tiles.push(new Game.Tile(this, i, j));
                }
            }
        }
        // Building Tile adjacent graph
        for (let i = 0; i < this._state.length; i++) {
            for (let j = 0; j < this._state[i].length; j++) {
                let id = this._state[i][j];
                if (id !== -1) {
                    let tile = this._map_graph_tiles.find(element => 
                        element.position.x === j && element.position.y === i);
                    if ((j - 1) >= 0 && this._state[i][j - 1] !== -1) {
                        // left tile is exist
                        tile.add_adjacents(this._map_graph_tiles.find(element =>
                            element.position.x === j - 1 && element.position.y === i));
                    }
                    if ((j + 1) < this._state[i].length && this._state[i][j + 1] !== -1) {
                        // right tile is exist
                        tile.add_adjacents(this._map_graph_tiles.find(element =>
                            element.position.x === j + 1 && element.position.y === i));
                    }
                    if ((i - 1) >= 0 && this._state[i - 1][j] !== -1) {
                        // up tile is exist
                        tile.add_adjacents(this._map_graph_tiles.find(element =>
                            element.position.x === j && element.position.y === i - 1));
                    }
                    if ((i + 1) < this._state.length && this._state[i + 1][j] !== -1) {
                        // down tile is exist
                        tile.add_adjacents(this._map_graph_tiles.find(element =>
                            element.position.x === j && element.position.y === i + 1));
                    }

                }
            }
        }
        this.render();
        return this._state;
    }

    step(action) {
        if (this._phase !== 0) return null;

        let action_performed = false;
        this._pacmans.forEach(element => {
            action_performed = element.move(action) || action_performed;
        });

        if (action_performed) {
            return this.nextPhase();
        }
        return null;
        // after calling step(), this._phase is set to 0.
        // It returns {reward: number, done: boolean, next_state: number[][]}
    }

    render() {
        let cellSize = 40;
        let margin = {top: 30, bottom: 30, left: 30, right: 30};
        let xSize = this._state[0].length;
        let ySize = this._state.length;
        let html = `
            <svg width=` + (cellSize * xSize + margin.left + margin.right) + ` height=` + (cellSize * ySize + margin.top + margin.bottom) + `>
                <g class="board" transform="translate(` + margin.left + `, ` + margin.top + `)">`;
        for (let i = 0; i < ySize; i++) {
            html += `
                    <g class="board-row" transform="translate(0, ` + (cellSize * i) + `)">`;
            for (let j = 0; j < xSize; j++) {
                html += `
                        <g class="board-cell" transform="translate(` + (cellSize * j) + `, 0)">`;
                let state = this._state[i][j];
                if (state === -3) {
                    // Ghost
                    html += `
                            <rect width="` + cellSize + `" height="` + cellSize + `" x="0" y="0" style="fill: rgb(255, 255, 255);"></rect>`;
                    /*
                    html += `
                            <text x="` + cellSize * 0.5 + `" y="` + cellSize * 0.5 + `" dominant-baseline="middle" text-anchor="middle" style="fill: rgb(96, 96, 96);">G</text>`;
                    */
                    html += `<image xlink:href="img/Ghost.bmp" height="` + cellSize + `" width="` + cellSize + `"></image>`;
                }
                else if (state === -2) {
                    // Pacman
                    html += `
                            <rect width="` + cellSize + `" height="` + cellSize + `" x="0" y="0" style="fill: rgb(255, 255, 255);"></rect>`;
                    /*
                    html += `
                            <text x="` + cellSize * 0.5 + `" y="` + cellSize * 0.5 + `" dominant-baseline="middle" text-anchor="middle" style="fill: rgb(96, 64, 235);">P</text>`;
                    */
                    html += `<image xlink:href="img/Pacman.bmp" height="` + cellSize + `" width="` + cellSize + `"></image>`;
                }
                else if (state === -1) {
                    // Wall
                    html += `
                            <rect width="` + cellSize + `" height="` + cellSize + `" x="0" y="0" style="fill: rgb(0, 0, 0);"></rect>`;
                }
                else if (state === 0) {
                    // empty
                    html += `
                            <rect width="` + cellSize + `" height="` + cellSize + `" x="0" y="0" style="fill: rgb(255, 255, 255);"></rect>`;
                }
                else if (state > 0) {
                    // Food
                    html += `
                            <rect width="` + cellSize + `" height="` + cellSize + `" x="0" y="0" style="fill: rgb(255, 255, 255);"></rect>`;
                    html += `
                            <circle r="` + (Math.min(state - 1, 5) * cellSize * 0.05 + cellSize * 0.125) + `" cx="` + cellSize * 0.5 + `" cy="` + cellSize * 0.5 + `" style="fill: rgb(96, 235, 64);"></circle>`;
                }
                html += `
                        </g>`;
            }
            html += `
                    </g>`;
        }
        html += `
                </g>
            </svg>`;
        while (this._board_ui.hasChildNodes()) {
            this._board_ui.removeChild(this._board_ui.firstChild);
        }
        this._board_ui.insertAdjacentHTML('beforeend', html);
    }

    nextPhase() {
        this._phase = this._phase + 1;
        let reward = 0;
        let done = false;
        if (this._phase === 1 || this._phase === 3) {
            const {eaten, dead} = this.calculateState();
            for (let element of eaten) {
                reward += element.size * 10;
                this._foods = this._foods.filter(function(value, index, array) {
                    return value.id !== element.id ||
                        value.position.x !== element.position.x ||
                        value.position.y !== element.position.y;
                })
            }
            for (let element of dead) {
                reward -= 50;
                this._pacmans = this._pacmans.filter(function(value, index, array) {
                    return value.id !== element.id ||
                        value.position.x !== element.position.x ||
                        value.position.y !== element.position.y;
                })
            }
            if (this._pacmans.length === 0) {
                done = true;
            }
            else if (this._foods.length === 0) {
                reward += 100;
                done = true;
            }
            
            this.render();

            if (!done) {
                let result = this.nextPhase();
                return {reward: reward + result.reward, done: result.done, next_state: this._state}
            }
            return {reward: reward, done: done, next_state: this._state}
        }
        else if (this._phase === 2) {
            this._ghosts.forEach(element => element.move());
            return this.nextPhase();
        }
        else if (this._phase === 4) {
            this._turn = this._turn + 1;
            this._phase = 0;
            // Player's turn
            return {reward: reward, done: done, next_state: this._state}
        }
    }

    calculateState() {
        /* Update this._state */
        for (let i = 0; i < this._state.length; i++) {
            for (let j = 0; j < this._state[i].length; j++) {
                let id = this._state[i][j];
                if (id === -2 && this.phase === 1) {
                    this._state[i][j] = 0;
                }
                else if (id === -3 && this.phase === 3) {
                    if (this._foods.findIndex(element => {
                            return element.position.x === j && element.position.y === i
                        }) === -1) {
                        this._state[i][j] = 0;
                    }
                    else {
                        this._state[i][j] = this._foods.find(element => {
                            return element.position.x === j && element.position.y === i
                        }).size;
                    }
                }
            }
        }
        for (let element of this._pacmans) {
            this._state[element.position.y][element.position.x] = -2;
        }
        for (let element of this._ghosts) {
            this._state[element.position.y][element.position.x] = -3;
        }

        /* Find objects that should be updated */
        let eatenFoods = [];
        let deadPacmans = [];
        for (let element of this._pacmans) {
            if (this._foods.findIndex((food) => {
                    return element.position.x == food.position.x && element.position.y == food.position.y
                }) !== -1) {
                eatenFoods.push(this._foods.find((food) => {
                        return element.position.x === food.position.x && element.position.y === food.position.y
                    }));
            }
            if (this._ghosts.findIndex((ghost) => {
                    return element.position.x === ghost.position.x && element.position.y === ghost.position.y
                }) !== -1) {
                deadPacmans.push(element);
            }
        }
        return {eaten: eatenFoods, dead: deadPacmans};
    }
    
    /**
	 * @param {number} y
	 * @param {number} x
	 * @return {boolean}
	 */
    canPass(y, x) {
        if (y < 0 || y >= this._map.length ||
            x < 0 || x >= this._map[y].length)
            return false;
        if (this._phase === 0 &&
            this._pacmans.findIndex(pacman => pacman.position.x === x && pacman.position.y === y) !== -1) {
            return false;
        }
        if (this._phase === 2 &&
            this._ghosts.findIndex(ghost => ghost.position.x === x && ghost.position.y === y) !== -1) {
            return false;
        }
        return this._map[y][x];
    }

    get action_space() {
        return ["left", "right", "down", "up"];
    }

    /**
     * If one of our pacmans can move to a direction, this action can be performed.
     * @return {string[]} may includes "left", "right", "down", "up".
     */
    get possible_actions() {
        let actions = [];
        if (this._pacmans.length < 1 || this._phase !== 0) return actions;
        this._pacmans.some(element => {
            if (this.canPass(element.position.y, element.position.x - 1)) {
                actions.push("left");
                return true;
            }
            return false;
        });
        this._pacmans.some(element => {
            if (this.canPass(element.position.y, element.position.x + 1)) {
                actions.push("right");
                return true;
            }
            return false;
        });
        this._pacmans.some(element => {
            if (this.canPass(element.position.y + 1, element.position.x)) {
                actions.push("down");
                return true;
            }
            return false;
        });
        this._pacmans.some(element => {
            if (this.canPass(element.position.y - 1, element.position.x)) {
                actions.push("up");
                return true;
            }
            return false;
        });
        return actions;
    }
    /*
    get feature_function(state, action) {
        // TODO
    }
    */

    get phase() {
        return this._phase;
    }

    get pacmans() {
        return this._pacmans;
    }

    get map_graph_tiles() {
        return this._map_graph_tiles;
    }
}

Game.Tile = class {
    /**
     * Constructor for Tile
     * @param {Game} game 
     * @param {number} y 
     * @param {number} x 
     */
    constructor(game, y, x) {
        this._game = game;
        this._position_x = x;
        this._position_y = y;
        this._adjacents = [];
    }

    /**
     * @param {Game.Tile} tile
     */
    add_adjacents(tile) {
        this._adjacents.push(tile);
    }

    get adjacents() {
        return this._adjacents;
    }

    get pos_id() {
        return 't' + this._position_x + '_' + this._position_y;
    }

    get position() {
        return {x: this._position_x, y: this._position_y};
    }
}

Game.Pacman = class {
    /**
     * Constructor for Pacman
     * @param {Game} game
     * @param {number} y 
     * @param {number} x 
     */
    constructor(game, y, x) {
        this._id = -2;
        this._game = game;
        this._position_x = x;
        this._position_y = y;
    }

    /**
     * 
     * @param {string} direction 
     * @returns {boolean}
     */
    move(direction) {
        let b = false;
        if (this._game.phase !== 0) return b;
        if (direction === "left" &&
            this._game.canPass(this._position_y, this._position_x - 1)) {
            this._position_x = this._position_x - 1;
            b = true;
        }
        else if (direction === "right" &&
            this._game.canPass(this._position_y, this._position_x + 1)) {
            this._position_x = this._position_x + 1;
            b = true;
        }
        else if (direction === "down" &&
            this._game.canPass(this._position_y + 1, this._position_x)) {
            this._position_y = this._position_y + 1;
            b = true;
        }
        else if (direction === "up" &&
            this._game.canPass(this._position_y - 1, this._position_x)) {
            this._position_y = this._position_y - 1;
            b = true;
        }
        return b;
    }

    get id() {
        return this._id;
    }

    get position() {
        return {x: this._position_x, y: this._position_y};
    }
}

Game.Ghost = class {
    /**
     * Constructor for Ghost
     * @param {Game} game
     * @param {number} y 
     * @param {number} x 
     */
    constructor(game, y, x) {
        this._id = -3;
        this._game = game;
        this._position_x = x;
        this._position_y = y;
    }

    move() {
        if (this._game.phase !== 2) return false;
        let min_path_length = Number.POSITIVE_INFINITY;
        let min_path = [];
        let my_tile = this._game.map_graph_tiles.find(element => 
            element.position.x === this._position_x &&
            element.position.y === this._position_y);

        // Move toward the nearest pacman.
        for (let pacman of this._game.pacmans) {
            let goal_tile = this._game.map_graph_tiles.find(element => 
                element.position.x === pacman.position.x &&
                element.position.y === pacman.position.y);
            let path = this.a_star(my_tile, goal_tile);
            if (path.length > 0 && min_path_length > 0 && path.length < min_path_length) {
                min_path_length = path.length;
                min_path = path;
            }
        }
        if (min_path.length <= 1) return false;

        this._position_x = min_path[1].position.x;
        this._position_y = min_path[1].position.y;
        return true;
    }

    /**
     * This method is used in a_star().
     * @param {object} came_from 
     * @param {Game.Tile} current 
     * @returns {Game.Tile[]} total_path
     */
    reconstruct_path(came_from, current) {
        let total_path = [current];
        while (current.pos_id in came_from) {
            current = came_from[current.pos_id];
            total_path.unshift(current);
        }
        return total_path;
    }

    /**
     * A* finds a path from start to goal. (https://en.wikipedia.org/wiki/A*_search_algorithm)
     * @param {Game.Tile} start 
     * @param {Game.Tile} goal 
     */
    a_star(start, goal) {
        // Heuristic function 'h' will be the straight-line Manhattan distance to the goal
        // (physically the smallest possible distance)
        let h = tile => 
            Math.abs(goal.position.x - tile.position.x) +
            Math.abs(goal.position.y - tile.position.y);
        let open_set = [start];
        let closed_set = [];
        let came_from = {};
        let g_score = {};
        g_score[start.pos_id] = 0;
        let f_score = {};
        f_score[start.pos_id] = h(start);

        while (open_set.length > 0) {
            let min_value = Number.POSITIVE_INFINITY;
            let current = null;
            for (let node of open_set) {
                if (f_score[node.pos_id] < min_value) {
                    min_value = f_score[node.pos_id];
                    current = node;
                }
            }

            if (current.pos_id === goal.pos_id) {
                // Reached to goal!
                return this.reconstruct_path(came_from, current)
            }

            open_set = open_set.filter(function(value, index, array) {
                return value.pos_id !== current.pos_id;
            });
            closed_set.push(current);
            for (let neighbor of current.adjacents) {
                if (neighbor in closed_set || 
                    this._game._ghosts.findIndex(ghost =>
                        ghost.position.x === neighbor.position.x &&
                        ghost.position.y === neighbor.position.y) !== -1) {
                    continue;
                }

                // Adjacent tile distance is 1.
                let tentative_g_score = g_score[current.pos_id] + 1;
                if (!(neighbor.pos_id in g_score)) {
                    g_score[neighbor.pos_id] = Number.POSITIVE_INFINITY;
                }
                if (tentative_g_score < g_score[neighbor.pos_id]) {
                    came_from[neighbor.pos_id] = current;
                    g_score[neighbor.pos_id] = tentative_g_score;
                    f_score[neighbor.pos_id] = g_score[neighbor.pos_id] + h(neighbor);
                    if (!(neighbor in open_set)) {
                        open_set.push(neighbor);
                    }
                } 
            }
        }
        // Goal was never reached.
        return [];
    }
    
    get id() {
        return this._id;
    }

    get position() {
        return {x: this._position_x, y: this._position_y};
    }
}

Game.Food = class {
    /**
     * Constructor for Food
     * @param {Game} game
     * @param {number} size 
     * @param {number} y 
     * @param {number} x 
     */
    constructor(game, size, y, x) {
        this._id = 1;
        this._game = game;
        this._size = size;
        this._position_x = x;
        this._position_y = y;
    }
    
    get id() {
        return this._id;
    }

    get size() {
        return this._size;
    }

    get position() {
        return {x: this._position_x, y: this._position_y};
    }
}