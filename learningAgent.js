/**
 * LearningAgent for reinforcement training.
 */
class LearningAgent {
	/**
	 * Constructor for LearningAgent
	 * @param {Network} network
	 * @param {Game} game
	 * @param {number} discount_rate
	 * @param {number} timeout
	 */
	constructor(network, game, discount_rate=0.99, timeout=10000) {
		this._network = network;
		this._game = game;
		this._timeout = timeout;
		this._curTime = 0;
		this._dr = discount_rate;
		this._curState = game.reset();
		this._done = false;
	}

	/**
	 * Runs a single iteration of reinforcement learning.
	 * If the game was already finished or timeout has been met, resets the game.
	 * @return {number} reward from this iteration.
	 */
	step() {
		if (this._done) {
			this.reset();
		}

		if (this._curTime >= this._timeout) {
			this.reset();
		}

		let q_vals = []
		game.action_space().forEach(a => {
			let f = game.feature_function(this._curState, a);
			q_vals.push(this._network.predict([f]))[0];
		})
		let action = this.argmax(q_vals);

		let reward, new_state, done = game.step(action);

		q_vals = []
		game.action_space().forEach(a => {
			let f = game.feature_function(new_state, a);
			q_vals.push(this._network.predict([f]))[0];
		})
		if (done) {
			let target = reward;
		} else {
			let target = reward + this.dr * this.max(q_vals);	
		}

		this._network.train(game.feature_function(this._curState, action), target);

		this._curState = new_state;
		this._done = done;
		this._curTime++;

		return reward;
	}

	/**
	 * Resets the game and the time counter.
	 */
	reset() {
		this._curState = game.reset();
		this._done = false;
		this._curTime = 0;
	}

	/**
	 * @param {number[]} array
	 * @return {int}
	 */
	argmax(array) {
		return array.map((x, 1) => [x, 1]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
	}

	/**
	 * @param {number[]} array
	 * @return {number}
	 */
	max(array) {
		return Math.max.apply(Math, array);
	}

	get game_finished() {
		return this._done;
	}

	set discount_rate(rate) {
		this._dr = rate;
	}

	set timeout(time) {
		this._timeout = time;
	}

	set network(network) {
		this._network = network;
		this.reset();
	}

	set game(game) {
		this._game = game;
		this.reset();
	}
}