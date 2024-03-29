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
		let action = Util.argmax(q_vals);

		let reward, new_state, done = game.step(action);

		q_vals = []
		game.action_space().forEach(a => {
			let f = game.feature_function(new_state, a);
			q_vals.push(this._network.predict([f]))[0];
		})
		if (done) {
			let target = reward;
		} else {
			let target = reward + this._dr * Util.max(q_vals);	
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

	get game_finished() {
		return this._done;
	}

	/**
	 * @param {number} rate
	 */
	set discount_rate(rate) {
		this._dr = rate;
	}

	/**
	 * @param {number} time 
	 */
	set timeout(time) {
		this._timeout = time;
	}

	/**
	 * @param {Network} network
	 */
	set network(network) {
		this._network = network;
		this.reset();
	}

	/**
	 * @param {Game} game
	 */
	set game(game) {
		this._game = game;
		this.reset();
	}
}