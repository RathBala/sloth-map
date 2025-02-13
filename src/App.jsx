/* eslint-disable no-debugger */
import { useContext, useState, useEffect, useRef } from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import TableView from './components/TableView';
import Settings from './components/Settings';
import Authentication from './components/Auth';
import SlothMap from './components/SlothMap';
import { UserContext } from './UserContext';
import { useSave } from './utils/useSave';
import './App.css';
import GoalModal from './components/GoalModal';
import plusIcon from './assets/Plus.svg';
import tableIcon from './assets/table.png';
import mapIcon from './assets/map.png';
import tableSelectedIcon from './assets/table-selected.png';
import mapSelectedIcon from './assets/map-selected.png';
import cogIcon from './assets/Cog.svg';
import cogSelectedIcon from './assets/Cog.svg';

const App = () => {
    const { userSettings, loading, slothMapData, goals } =
        useContext(UserContext);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const profileIconRef = useRef(null);

    // TODO: move goal modal stuff to a different component
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    const location = useLocation();

    const isTableSelected =
        location.pathname === '/' || location.pathname === '';
    const isMapSelected = location.pathname === '/map';
    const isSettingsSelected = location.pathname === '/settings';

    // TODO: move to different component
    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    // probably doesn't need to be a useEffect
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target) &&
                profileIconRef.current &&
                !profileIconRef.current.contains(event.target)
            ) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // probably doesn't need to be a userEffect
    useEffect(() => {
        setIsProfileMenuOpen(false);
    }, [userSettings]);

    // TODO: separate component
    const handleNewGoalClick = () => {
        setEditingGoal(null);
        setIsGoalModalOpen(true);
    };

    const handleGoalSave = (goal) => {
        saveGoal(goal);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!userSettings || !userSettings.email) {
        return <Authentication />;
    }

    const handleInterestRateChange = (e) =>
        setInterestRate(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleInvestmentReturnRateChange = (e) =>
        setInvestmentReturnRate(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleTargetNestEggChange = (e) =>
        setTargetNestEgg(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleDateOfBirthChange = (date) => {
        setDateOfBirth(date);
    };

    const { save } = useSave();

    return (
        <div className="App">
            {/* TODO: make these below components */}
            <div className="top-nav">
                <div className="top-nav-left">
                    <div className="profile-icon-container">
                        <svg
                            className="profile-icon"
                            width="44"
                            height="44"
                            viewBox="0 0 44 44"
                            onClick={toggleProfileMenu}
                            ref={profileIconRef}
                        >
                            <circle cx="22" cy="22" r="20" fill="#d2d2d2" />
                        </svg>
                        {isProfileMenuOpen && (
                            <div className="profile-menu" ref={profileMenuRef}>
                                <ul>
                                    <li onClick={logout}>Log out</li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="welcome">
                        <h4>
                            Welcome{' '}
                            {userSettings.email
                                ? userSettings.email
                                : 'No user logged in'}
                        </h4>
                    </div>
                </div>

                <div className="top-nav-center">
                    <div className="tab-group">
                        <Link
                            to="/"
                            className={`tab ${isTableSelected ? 'active-tab' : ''}`}
                        >
                            <img
                                src={
                                    isTableSelected
                                        ? tableSelectedIcon
                                        : tableIcon
                                }
                                alt="Table Icon"
                                className="tab-icon"
                            />{' '}
                            Table
                        </Link>
                        <Link
                            to="/map"
                            className={`tab ${isMapSelected ? 'active-tab' : ''}`}
                        >
                            <img
                                src={isMapSelected ? mapSelectedIcon : mapIcon}
                                alt="Map Icon"
                                className="tab-icon"
                            />{' '}
                            Map
                        </Link>
                        <Link
                            to="/settings"
                            className={`tab ${isSettingsSelected ? 'active-tab' : ''}`}
                        >
                            <img
                                src={
                                    isSettingsSelected
                                        ? cogSelectedIcon
                                        : cogIcon
                                }
                                alt="Settings Icon"
                                className="tab-icon"
                            />
                            Settings
                        </Link>
                    </div>
                </div>
            </div>

            <div className="action-buttons-container">
                <div className="left-buttons">
                    <button onClick={save}>Save</button>
                </div>
                {!isSettingsSelected && (
                    <div className="right-buttons">
                        <button
                            type="button"
                            onClick={handleNewGoalClick}
                            className="new-goal-button"
                        >
                            <img
                                src={plusIcon}
                                alt="Add Goal"
                                className="plus-icon"
                            />{' '}
                            New Goal
                        </button>
                    </div>
                )}
            </div>

            <div className="content">
                <Routes>
                    <Route
                        path="/map"
                        element={
                            <div className="slothmap-container">
                                <SlothMap data={slothMapData} />
                            </div>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <Settings
                                interestRate={userSettings.interestRate || ''}
                                investmentReturnRate={
                                    userSettings.investmentReturnRate || ''
                                }
                                targetNestEgg={userSettings.targetNestEgg || ''}
                                dateOfBirth={userSettings.dateOfBirth}
                                handleDateOfBirthChange={
                                    handleDateOfBirthChange
                                }
                                handleInterestRateChange={
                                    handleInterestRateChange
                                }
                                handleInvestmentReturnRateChange={
                                    handleInvestmentReturnRateChange
                                }
                                handleTargetNestEggChange={
                                    handleTargetNestEggChange
                                }
                                isSettingsPage={true}
                            />
                        }
                    />
                    <Route path="/" element={<TableView />} />
                    <Route
                        path="*"
                        element={<div>No match for this route</div>}
                    />
                </Routes>
                <GoalModal
                    isOpen={isGoalModalOpen}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSave={handleGoalSave}
                    goal={editingGoal}
                    goals={goals}
                />
            </div>
        </div>
    );
};

export default App;
