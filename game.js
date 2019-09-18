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
    constructor(map_state) {
        this._initial_state = map_state;
        this._state = this._initial_state;  // 2D number array. Current state.
        this._map = [];                     // 2D boolean array. If not wall then set to true.
        this._turn = 0;                     // number. Elapsed turn after game start.
        this._phase = 0;                    // number. Who's turn?
            // 0: player's turn, 1: calculating state, 2: enemys' turn, 3: calculating state
        this._pacmans = [];                 // Game.Pacman array.
        this._ghosts = [];                  // Game.Ghost array.
        this._foods = [];                   // Game.Food array.
        this._done = false;                 // boolean. Is game ends?
        this.reset();
    }

    /**
     * Resets the game.
     */
    reset() {
        this._state = this._initial_state;
        this._map = [];
        this._turn = 0;
        this._phase = 0;
        this._pacmans = [];
        this._ghosts = [];
        this._foods = [];
        this._done = false;
        for (let i = 0, line; line = this._state[i]; i++) {
            this._map.push([]);
            for (let j = 0, id; id = line[j]; j++) {
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
                }
            }
        }
        return this._state;
    }

    step(action) {
        if (this._phase !== 0) return null;

        let action_performed = false;
        this._pacmans.forEach(element => {
            action_performed = action_performed || element.move(action);
        });

        if (action_performed) {
            return this.nextPhase();
        }
        return null;
        // after calling step(), this._phase is set to 0.
        // It returns {reward: number, done: boolean, next_state: number[][]}
    }

    render() {
        // TODO
    }

    nextPhase() {
        this._phase = this._phase + 1;
        let reward = 0;
        let done = false;
        if (this._phase === 1 || this._phace === 3) {
            const {eaten, dead} = this.calculateState();
            for (let element in eaten) {
                reward += element.size * 10;
                this._foods = this._foods.filter(function(value, index, array) {
                    return value.id !== element.id ||
                        value.position.x !== element.position.x ||
                        value.position.y !== element.position.y;
                })
            }
            for (let element in dead) {
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
            // *TODO* Ghost moving
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
        for (let i = 0, line; line = this._state[i]; i++) {
            for (let j = 0, id; id = line[j]; j++) {
                if (id === -2) {
                    this._state[i][j] = 0;
                }
                else if (id === -3) {
                    if (this._foods.findIndex(element => {
                            element.position.x === j && element.position.y === i
                        }) === -1) {
                        this._state[i][j] = 0;
                    }
                    else {
                        this._state[i][j] = this._foods.find(element => {
                            element.position.x === j && element.position.y === i
                        }).size;
                    }
                }
            }
        }
        for (let element in this._pacmans) {
            this._state[element.position.y][element.position.x] = -2;
        }
        for (let element in this._ghosts) {
            this._state[element.position.y][element.position.x] = -3;
        }

        /* Find objects that should be updated */
        let eatenFoods = [];
        let deadPacmans = [];
        for (let element in this._pacmans) {
            if (this._foods.findIndex(() => {
                    element.position.x === j && element.position.y === i
                }) !== -1) {
                eatenFoods.push(this._foods.find(() => {
                        element.position.x === j && element.position.y === i
                    }));
            }
            if (this._ghosts.findIndex(() => {
                    element.position.x === j && element.position.y === i
                }) !== -1) {
                deadPacmans.push(element);
            }
        }
        return {eaten: eatenFoods, dead: deadPacmans};
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
            if (canPass(element._position_y, element._position_x - 1)) {
                actions.push("left");
                return true;
            }
        });
        this._pacmans.some(element => {
            if (canPass(element._position_y, element._position_x + 1)) {
                actions.push("right");
                return true;
            }
        });
        this._pacmans.some(element => {
            if (canPass(element._position_y - 1, element._position_x)) {
                actions.push("down");
                return true;
            }
        });
        this._pacmans.some(element => {
            if (canPass(element._position_y + 1, element._position_x - 1)) {
                actions.push("up");
                return true;
            }
        });
        return actions;
    }

    get feature_function(state, action) {
        // TODO
    }

    /**
	 * @param {number} y
	 * @param {number} x
	 * @return {boolean}
	 */
    get canPass(y, x) {
        if (y < 0 || y >= this._map.length ||
            x < 0 || x >= this._map[y].length)
            return false;
        return this._map[y][x];
    }

    get phase() {
        return this._phase;
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
            this._game.canPass(this._position_y - 1, this._position_x)) {
            this._position_y = this._position_y - 1;
            b = true;
        }
        else if (direction === "up" &&
            this._game.canPass(this._position_y + 1, this._position_x - 1)) {
            this._position_y = this._position_y + 1;
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
        // TODO
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