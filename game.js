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

    // calculate next state when an action is performed
    // without updating any real state and position of pacmans
    virtualStep(action) {
        if (this._phase !== 0) return null;

        let virtual_action_performed = false;
        let pacmans_new_position = [];
        for (let pacman of this._pacmans) {
            if (action === "left" &&
                this.canPass(pacman.position.y, pacman.position.x - 1)) {
                pacmans_new_position.push({x: pacman.position.x - 1, y: pacman.position.y});
                virtual_action_performed = true;
            }
            else if (action === "right" &&
                this.canPass(pacman.position.y, pacman.position.x + 1)) {
                pacmans_new_position.push({x: pacman.position.x + 1, y: pacman.position.y});
                virtual_action_performed = true;
            }
            else if (action === "down" &&
                this.canPass(pacman.position.y + 1, pacman.position.x)) {
                pacmans_new_position.push({x: pacman.position.x, y: pacman.position.y + 1});
                virtual_action_performed = true;
            }
            else if (action === "up" &&
                this.canPass(pacman.position.y - 1, pacman.position.x)) {
                pacmans_new_position.push({x: pacman.position.x, y: pacman.position.y - 1});
                virtual_action_performed = true;
            }
            else {
                pacmans_new_position.push({x: pacman.position.x, y: pacman.position.y});
            }
        }
        if (!virtual_action_performed) {
            return this._state;
        }
        let virtual_state = [];
        for (let i = 0; i < this._state.length; i++) {
            virtual_state.push([]);
            for (let j = 0; j < this._state[i].length; j++) {
                let id = this._state[i][j];
                if (id === -2) {
                    virtual_state[i].push(0);
                }
                else {
                    virtual_state[i].push(id);
                }
            }
        }
        for (let element of pacmans_new_position) {
            virtual_state[element.y][element.x] = -2;
        }
        for (let element of this._ghosts) {
            virtual_state[element.position.y][element.position.x] = -3;
        }

        /* Find objects that should be updated */
        let virtual_eatenFoods = [];
        let virtual_deadPacmans = [];
        for (let element of pacmans_new_position) {
            if (this._foods.findIndex((food) => {
                    return element.x == food.position.x && element.y == food.position.y
                }) !== -1) {
                virtual_eatenFoods.push(this._foods.find((food) => {
                        return element.x === food.position.x && element.y === food.position.y
                    }));
            }
            if (this._ghosts.findIndex((ghost) => {
                    return element.x === ghost.position.x && element.y === ghost.position.y
                }) !== -1) {
                virtual_deadPacmans.push(element);
            }
        }
        return {eaten: virtual_eatenFoods, dead: virtual_deadPacmans, next_state: virtual_state};
        // it returns {eaten: list of Food, dead: list of {x: number, y: number}, next_state: number[][]}
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
                    html += `<image xlink:href="img/Ghost.bmp" height="` + cellSize + `" width="` + cellSize + `"></image>`;
                    html += `
                            <text x="` + cellSize * 0.5 + `" y="` + cellSize * 0.5 + `" dominant-baseline="middle" text-anchor="middle" font-size="10" style="fill: rgb(235, 32, 64);">` + 
                            this._ghosts.find(ghost => ghost.position.x === j && ghost.position.y === i).ghost_num + `</text>`;
                }
                else if (state === -2) {
                    // Pacman
                    html += `
                            <rect width="` + cellSize + `" height="` + cellSize + `" x="0" y="0" style="fill: rgb(255, 255, 255);"></rect>`;
                    html += `<image xlink:href="img/Pacman.bmp" height="` + cellSize + `" width="` + cellSize + `"></image>`;
                    html += `
                    <text x="` + cellSize * 0.5 + `" y="` + cellSize * 0.5 + `" dominant-baseline="middle" text-anchor="middle" font-size="10" style="fill: rgb(235, 216, 64);">` +
                    this._pacmans.find(pacman => pacman.position.x === j && pacman.position.y === i).pacman_num + `</text>`;
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
                    let img;
                    if (state < 3) img = 'Food1.bmp';
                    else img = 'Food2.bmp';
                    html += `
                            <rect width="` + cellSize + `" height="` + cellSize + `" x="0" y="0" style="fill: rgb(255, 255, 255);"></rect>`;
                    html += `<image xlink:href="img/` + img + `" height="` + cellSize + `" width="` + cellSize + `"></image>`;
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
    
    /**
     * All features are computed by the state used in render function.
     * This state may differ from the genuine state used internally!
     * @param {string} [feature_name]
     * @return {function(number[][], string) => *}
     */
    feature_function(feature_name) {
        let features = {};
        /*
        features["pacmanPositions"] = (s, a) => {
            let list = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) list.push({x: j, y: i});
                }
            }
            return list;
        };
        features["foodPositions"] = (s, a) => {
            let list = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) list.push({x: j, y: i});
                }
            }
            return list;
        };
        */
        features["numberOfFoods"] = (s, a) => {
            let count = 0;
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) count++;
                }
            }
            return count;
        };
        /*
        features["ghostPositions"] = (s, a) => {
            let list = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) list.push({x: j, y: i});
                }
            }
            return list;
        };
        */
        features["numberOfGhosts"] = (s, a) => {
            let count = 0;
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) count++;
                }
            }
            return count;
        };
        features["distanceToTheClosestFoodInEuclidian"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let food of foodList) {
                for (let pacman of pacmanList) {
                    let d = Math.pow(food.x - pacman.x, 2) + Math.pow(food.y - pacman.y, 2);
                    if (distance > d) distance = d;
                }
            }
            return Math.sqrt(distance);
        };
        features["distanceToTheClosestFoodInManhattan"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let food of foodList) {
                for (let pacman of pacmanList) {
                    let d = Math.abs(food.x - pacman.x) + Math.abs(food.y - pacman.y);
                    if (distance > d) distance = d;
                }
            }
            return distance;
        };
        features["distanceToTheClosestFoodInChebyshev"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let food of foodList) {
                for (let pacman of pacmanList) {
                    let d = Math.max(Math.abs(food.x - pacman.x), Math.abs(food.y - pacman.y));
                    if (distance > d) distance = d;
                }
            }
            return distance;
        };
        features["distanceToTheClosestFoodInReal"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let pacman of pacmanList) {
                let my_tile = this.map_graph_tiles.find(element => 
                    element.position.x === pacman.x &&
                    element.position.y === pacman.y);
                for (let food of foodList) {
                    let goal_tile = this.map_graph_tiles.find(element => 
                        element.position.x === food.x &&
                        element.position.y === food.y);
                    let d = Game.Util.a_star(my_tile, goal_tile, this._ghosts).length - 1;
                    if (d >= 0 && distance > d) distance = d;
                }
            }
            return distance;
        };
        features["inverseOfDistanceToTheClosestFoodInEuclidian"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let food of foodList) {
                for (let pacman of pacmanList) {
                    let d = Math.pow(food.x - pacman.x, 2) + Math.pow(food.y - pacman.y, 2);
                    if (distance > d) distance = d;
                }
            }
            let ret = Math.sqrt(distance);
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["inverseOfDistanceToTheClosestFoodInManhattan"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let food of foodList) {
                for (let pacman of pacmanList) {
                    let d = Math.abs(food.x - pacman.x) + Math.abs(food.y - pacman.y);
                    if (distance > d) distance = d;
                }
            }
            let ret = distance;
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["inverseOfDistanceToTheClosestFoodInChebyshev"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let food of foodList) {
                for (let pacman of pacmanList) {
                    let d = Math.max(Math.abs(food.x - pacman.x), Math.abs(food.y - pacman.y));
                    if (distance > d) distance = d;
                }
            }
            let ret = distance;
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["inverseOfDistanceToTheClosestFoodInReal"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let pacman of pacmanList) {
                let my_tile = this.map_graph_tiles.find(element => 
                    element.position.x === pacman.x &&
                    element.position.y === pacman.y);
                for (let food of foodList) {
                    let goal_tile = this.map_graph_tiles.find(element => 
                        element.position.x === food.x &&
                        element.position.y === food.y);
                    let d = Game.Util.a_star(my_tile, goal_tile, this._ghosts).length - 1;
                    if (d >= 0 && distance > d) distance = d;
                }
            }
            let ret = distance;
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["distanceToTheClosestGhostInEuclidian"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let ghost of ghostList) {
                for (let pacman of pacmanList) {
                    let d = Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2);
                    if (distance > d) distance = d;
                }
            }
            return Math.sqrt(distance);
        };
        features["distanceToTheClosestGhostInManhattan"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let ghost of ghostList) {
                for (let pacman of pacmanList) {
                    let d = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
                    if (distance > d) distance = d;
                }
            }
            return distance;
        };
        features["distanceToTheClosestGhostInChebyshev"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let ghost of ghostList) {
                for (let pacman of pacmanList) {
                    let d = Math.max(Math.abs(ghost.x - pacman.x), Math.abs(ghost.y - pacman.y));
                    if (distance > d) distance = d;
                }
            }
            return distance;
        };
        features["distanceToTheClosestGhostInReal"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let pacman of pacmanList) {
                let my_tile = this.map_graph_tiles.find(element => 
                    element.position.x === pacman.x &&
                    element.position.y === pacman.y);
                for (let ghost of ghostList) {
                    let goal_tile = this.map_graph_tiles.find(element => 
                        element.position.x === ghost.x &&
                        element.position.y === ghost.y);
                    let d = Game.Util.a_star(my_tile, goal_tile).length - 1;
                    if (d >= 0 && distance > d) distance = d;
                }
            }
            return distance;
        };
        features["inverseOfDistanceToTheClosestGhostInEuclidian"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let ghost of ghostList) {
                for (let pacman of pacmanList) {
                    let d = Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2);
                    if (distance > d) distance = d;
                }
            }
            let ret = Math.sqrt(distance);
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["inverseOfDistanceToTheClosestGhostInManhattan"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let ghost of ghostList) {
                for (let pacman of pacmanList) {
                    let d = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
                    if (distance > d) distance = d;
                }
            }
            let ret = distance;
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["inverseOfDistanceToTheClosestGhostInChebyshev"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let ghost of ghostList) {
                for (let pacman of pacmanList) {
                    let d = Math.max(Math.abs(ghost.x - pacman.x), Math.abs(ghost.y - pacman.y));
                    if (distance > d) distance = d;
                }
            }
            let ret = distance;
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["inverseOfDistanceToTheClosestGhostInReal"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let pacman of pacmanList) {
                let my_tile = this.map_graph_tiles.find(element => 
                    element.position.x === pacman.x &&
                    element.position.y === pacman.y);
                for (let ghost of ghostList) {
                    let goal_tile = this.map_graph_tiles.find(element => 
                        element.position.x === ghost.x &&
                        element.position.y === ghost.y);
                    let d = Game.Util.a_star(my_tile, goal_tile).length - 1;
                    if (d >= 0 && distance > d) distance = d;
                }
            }
            let ret = distance;
            if (ret === 0) return Number.POSITIVE_INFINITY;
            else return 1 / ret;
        };
        features["whetherAFoodIsOnANeighboringSpace"] = (s, a) => {
            let foodList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] >= 1) foodList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let food of foodList) {
                for (let pacman of pacmanList) {
                    let d = Math.abs(food.x - pacman.x) + Math.abs(food.y - pacman.y);
                    if (distance > d) distance = d;
                }
            }
            if (distance === 1)
                return 1;
            else return 0;
        };
        features["whetherAGhostIsOnANeighboringSpace"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let ghost of ghostList) {
                for (let pacman of pacmanList) {
                    let d = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
                    if (distance > d) distance = d;
                }
            }
            if (distance === 1)
                return 1;
            else return 0;
        };
        features["canAPacmanDie"] = (s, a) => {
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let pacman of pacmanList) {
                let my_tile = this.map_graph_tiles.find(element => 
                    element.position.x === pacman.x &&
                    element.position.y === pacman.y);
                for (let ghost of ghostList) {
                    let goal_tile = this.map_graph_tiles.find(element => 
                        element.position.x === ghost.x &&
                        element.position.y === ghost.y);
                    let d = Game.Util.a_star(my_tile, goal_tile).length - 1;
                    if (d >= 0 && distance > d) {
                        distance = d;
                    } 
                }
            }
            if (distance <= 2) return 1;
            else return 0;
        }
        features["isAPacmanDieWithAction"] = (s, a) => {
            if (this.possible_actions.find(e => e === a) == undefined) return 0;
            let move_dir;
            if (a === "left") move_dir = {x: -1, y: 0};
            else if (a === "right") move_dir = {x: 1, y: 0};
            else if (a === "up") move_dir = {x: 0, y: -1};
            else if (a === "down") move_dir = {x: 0, y: 1};
            let ghostList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -3) ghostList.push({x: j, y: i});
                }
            }
            let pacmanList = [];
            for (let i = 0; i < s.length; i++) {
                for (let j = 0; j < s[i].length; j++) {
                    if (s[i][j] === -2) pacmanList.push({x: j, y: i});
                }
            }
            let distance = Number.POSITIVE_INFINITY;
            for (let pacman of pacmanList) {
                let my_tile = this.map_graph_tiles.find(element => 
                    element.position.x === pacman.x + move_dir.x &&
                    element.position.y === pacman.y + move_dir.y);
                for (let ghost of ghostList) {
                    let goal_tile = this.map_graph_tiles.find(element => 
                        element.position.x === ghost.x &&
                        element.position.y === ghost.y);
                    let d = Game.Util.a_star(my_tile, goal_tile).length - 1;
                    if (d >= 0 && distance > d) {
                        distance = d;
                    } 
                }
            }
            if (distance <= 1) return 1;
            else return 0;
        }

        if (feature_name === undefined)
            return features;
        else
            return features[feature_name];
    }

    get action_space() {
        return ["left", "right", "down", "up"];
    }

    get state() {
        return this._state;
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
    static count = 0;

    /**
     * Constructor for Pacman
     * @param {Game} game
     * @param {number} y 
     * @param {number} x 
     */
    constructor(game, y, x) {
        Game.Pacman.count++;
        this._id = -2;
        this._pacman_num = Game.Pacman.count;
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

    get pacman_num() {
        return this._pacman_num;
    }
}

Game.Ghost = class {
    static count = 0;

    /**
     * Constructor for Ghost
     * @param {Game} game
     * @param {number} y 
     * @param {number} x 
     */
    constructor(game, y, x) {
        Game.Ghost.count++;
        this._id = -3;
        this._ghost_num = Game.Ghost.count;
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
            let path = Game.Util.a_star(my_tile, goal_tile, this._game._ghosts);
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
    
    get id() {
        return this._id;
    }

    get position() {
        return {x: this._position_x, y: this._position_y};
    }

    get ghost_num() {
        return this._ghost_num;
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

Game.Util = class {
    /**
     * This method is used in a_star().
     * @param {Object} came_from 
     * @param {Game.Tile} current 
     * @returns {Game.Tile[]} total_path
     */
    static reconstruct_path(came_from, current) {
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
     * @param {Object[]} [obstacles]
     * @param {number} obstacles[].position.x
     * @param {number} obstacles[].position.y
     */
    static a_star(start, goal, obstacles) {
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
                return Game.Util.reconstruct_path(came_from, current)
            }

            open_set = open_set.filter(function(value, index, array) {
                return value.pos_id !== current.pos_id;
            });
            closed_set.push(current);
            for (let neighbor of current.adjacents) {
                if (neighbor in closed_set || (
                    obstacles != undefined &&
                    obstacles.findIndex(obstacle =>
                        obstacle.position.x === neighbor.position.x &&
                        obstacle.position.y === neighbor.position.y) !== -1)) {
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
}