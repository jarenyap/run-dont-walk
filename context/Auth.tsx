import { createContext, useContext, useState, useEffect, PropsWithChildren } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as FBsignOut, updateProfile } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { UserProfile } from "../types/index";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (username: string, email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;
    
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);

            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (firebaseUser) {
                setLoading(true);
                unsubscribeProfile = onSnapshot(
                    doc(db, "users", firebaseUser.uid),
                    (snap) => {
                        if (snap.exists()) {
                            setProfile(snap.data() as UserProfile);
                        } else {
                            setProfile(null);
                        }
                        setLoading(false);
                    },
                    ()=> {
                        setProfile(null);
                        setLoading(false);
                    }
                );
            } else {
                setProfile(null);
                setLoading(false);
            }
        });
        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);


const signIn = async (email: string, pass: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, pass);
};

const signUp = async (username: string, email: string, pass: string): Promise<void> => {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(user, { displayName: username });
    await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: username,
        nameLower: username.toLowerCase(),
        email: email,
        bio: "",
        avatarUrl: null,
        totalDistance: 0,
        totalRuns: 0,
        followingIds: [],
        followerIds: [],
        followersCount: 0,
        clanIds: [],
        createdAt: serverTimestamp()
    });
};

const signOut = async (): Promise<void> => {
    await FBsignOut(auth);
};

return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
        {children}
    </AuthContext.Provider>
);
};

export const useAuth = () => useContext(AuthContext);