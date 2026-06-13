import { createContext, useContext, useState, useEffect, PropsWithChildren } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as FBsignOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
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
        let unsubscribeProfile: () => void;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                 setUser(firebaseUser);
                 if (firebaseUser) {
                     unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (profileSS) => {
                     if (profileSS.exists()) {
                         setProfile(profileSS.data() as UserProfile);
                     } else {
                         setProfile(null);
                     }
                     setLoading(false);
                    });
                } else {
                    if (unsubscribeProfile) {
                        unsubscribeProfile();
                    }
                    setProfile(null);
                    setLoading(false);
                } 
            } catch {
                if (unsubscribeProfile) {
                    unsubscribeProfile();
                }
                setProfile(null);
                setLoading(false);
            }
        });
                
    return () => {
        unsubscribe();
        if (unsubscribeProfile) {
            unsubscribeProfile();
        }
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
        displayName: username.toLowerCase(),
        email: email,
        bio: "",
        avatarUrl: null,
        totalDistance: 0,
        totalRuns: 0,
        role: "user",
        followingIds: [],
        followerIds: [],
        clanId: null,
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