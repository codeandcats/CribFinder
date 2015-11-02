export interface ISubscribable<T> {
	then(subscriberId: string, callback: (T) => any): void;
	then(callback: (T) => any): void;
	unsubscribe(subscriberId: string): void;
}

export interface IPublishable<T> {
	invoke(data: T): void;
}

export interface ISubscriber<T>
{
	id: string;
	callback: (T) => any;
}

export interface IEventArgs {
}

export class Eventable<T extends IEventArgs> implements ISubscribable<T>, IPublishable<T> {
	
	private subscribers: ISubscriber<T>[] = [];
	
	public then(subscriberId: string, callback: (T) => any): void;
	public then(callback: (T) => any): void;
	public then() {
		if (arguments.length == 0) {
			throw new Error('Invalid Args');
		}
		
		var subscriberId: string, callback: (T) => any; 
		
		if (typeof arguments[0] == 'string' || typeof arguments[0] == 'number') {
			subscriberId = arguments[0];
			callback = arguments[1];
		}
		else {
			callback = arguments[0];
		}
		
		if (typeof callback != 'function') {
			throw new Error('Invalid Args');
		}
		
		this.subscribers.push({
			id: subscriberId,
			callback: callback
		});
	}
	
	public unsubscribe(subscriberId: string): void {
		for (var index = 0; index < this.subscribers.length;) {
			if (this.subscribers[index].id == subscriberId) {
				this.subscribers.splice(index, 1);
			}
			else {
				index++;
			}
		}
	}
	
	public invoke(data: T): void {
		this.subscribers.forEach(subscriber => {
			subscriber.callback(data);
		});
	}
}