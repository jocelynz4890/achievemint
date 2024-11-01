import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export enum Role {
  ContentCreator = "ContentCreator",
  RegularUser = "RegularUser",
}

export interface UserDoc extends BaseDoc {
  username: string;
  password: string;
  role: Role;
  defaults: Array<ObjectId>;
}

/**
 * concept: Authenticating
 */
export default class AuthenticatingConcept {
  public readonly users: DocCollection<UserDoc>;

  /**
   * Make an instance of Authenticating.
   */
  constructor(collectionName: string) {
    this.users = new DocCollection<UserDoc>(collectionName);

    // Create index on username to make search queries for it performant
    void this.users.collection.createIndex({ username: 1 });
  }

  async isDefaultsEmpty(_id: ObjectId) {
    const user = await this.users.readOne({ _id });
    if (user) {
      try {
        if (user.defaults) {
          return user.defaults.length == 0;
        }
        return false;
      } catch (_) {
        throw new Error("checking if defaults is empty threw an error" + user.defaults);
      }
    }
    throw new NotFoundError(`User not found when getting default collections!`);
  }

  async create(username: string, password: string, role: Role) {
    await this.assertGoodCredentials(username, password);
    if (role !== Role.ContentCreator && role !== Role.RegularUser) return { msg: "Role must be ContentCreator or RegularUser!" };
    const _id = await this.users.createOne({ username: username, password: password, role: role });
    return { msg: "User created successfully!", user: await this.users.readOne({ _id }) };
  }

  private redactPassword(user: UserDoc): Omit<UserDoc, "password"> {
    // eslint-disable-next-line
    const { password, ...rest } = user;
    return rest;
  }

  async getUserById(_id: ObjectId) {
    const user = await this.users.readOne({ _id });
    if (user === null) {
      throw new NotFoundError(`User not found when getting by id!`);
    }
    return this.redactPassword(user);
  }

  async setDefaults(_id: ObjectId, defaults: Array<ObjectId>) {
    const user = await this.users.readOne({ _id });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    await this.users.partialUpdateOne({ _id }, { defaults: defaults });
    return { msg: "User defaults set successfully!" };
  }

  async getDefaults(_id: ObjectId) {
    const user = await this.users.readOne({ _id });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user.defaults;
  }

  async getUserByUsername(username: string) {
    const user = await this.users.readOne({ username });
    if (user === null) {
      throw new NotFoundError(`User not found when getting by username!`);
    }
    return this.redactPassword(user);
  }

  async getUsersByRole(role: Role) {
    return await this.users.readMany({ role });
  }

  async getUserRole(_id: ObjectId) {
    const user = await this.users.readOne({ _id });
    if (user === null) {
      throw new NotFoundError(`User not found when getting role!`);
    }
    return user.role;
  }

  async idsToUsernames(ids: ObjectId[]) {
    const users = await this.users.readMany({ _id: { $in: ids } });

    // Store strings in Map because ObjectId comparison by reference is wrong
    const idToUser = new Map(users.map((user) => [user._id.toString(), user]));
    return ids.map((id) => idToUser.get(id.toString())?.username ?? "DELETED_USER");
  }

  async getUsers(username?: string) {
    // If username is undefined, return all users by applying empty filter
    const filter = username ? { username } : {};
    const users = (await this.users.readMany(filter)).map(this.redactPassword);
    return users;
  }

  async authenticate(username: string, password: string) {
    const user = await this.users.readOne({ username, password });
    if (!user) {
      throw new NotAllowedError("Username or password is incorrect.");
    }
    return { msg: "Successfully authenticated.", _id: user._id };
  }

  async updateUsername(_id: ObjectId, username: string) {
    await this.assertUsernameUnique(username);
    await this.users.partialUpdateOne({ _id }, { username });
    return { msg: "Username updated successfully!" };
  }

  async updatePassword(_id: ObjectId, currentPassword: string, newPassword: string) {
    const user = await this.users.readOne({ _id });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.password !== currentPassword) {
      throw new NotAllowedError("The given current password is wrong!");
    }

    await this.users.partialUpdateOne({ _id }, { password: newPassword });
    return { msg: "Password updated successfully!" };
  }

  async delete(_id: ObjectId) {
    await this.users.deleteOne({ _id });
    return { msg: "User deleted!" };
  }

  async assertUserExists(_id: ObjectId) {
    const maybeUser = await this.users.readOne({ _id });
    if (maybeUser === null) {
      throw new NotFoundError(`User not found when asserting exists!`);
    }
  }

  private async assertGoodCredentials(username: string, password: string) {
    console.log(username, password);
    if (!username || !password) {
      throw new BadValuesError("Username and password must be non-empty!");
    }
    await this.assertUsernameUnique(username);
  }

  private async assertUsernameUnique(username: string) {
    if (await this.users.readOne({ username })) {
      throw new NotAllowedError(`User with username ${username} already exists!`);
    }
  }
}
